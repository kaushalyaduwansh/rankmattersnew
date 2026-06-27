import crypto from "crypto";
import { db } from "@/db"; 
import { sscResults, recentExams } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// Helper: Generate URLs for up to 6 potential sections
function getNormalizedUrls(inputUrl: string): string[] {
  const basePattern = /(ViewCandResponse)\d*/i;
  const baseUrl = inputUrl.trim().replace(basePattern, "ViewCandResponse");
  return [
    baseUrl, // Page 1
    baseUrl.replace("ViewCandResponse", "ViewCandResponse2"),
    baseUrl.replace("ViewCandResponse", "ViewCandResponse3"),
    baseUrl.replace("ViewCandResponse", "ViewCandResponse4"),
    baseUrl.replace("ViewCandResponse", "ViewCandResponse5"),
    baseUrl.replace("ViewCandResponse", "ViewCandResponse6"),
  ];  
}

// Helper: Smartly map raw text to a clean DB key and a pretty Display Name
function parseSubjectName(rawText: string, index: number) {
  const text = rawText.toLowerCase().trim();
  
  if (text.includes("computer")) return { key: "computer", shortName: "Comp." };
  if (text.includes("reasoning") || text.includes("intelligence") || text.includes("logic")) return { key: "reasoning", shortName: "Reas." };
  if (text.includes("general knowledge") || text.includes("awareness") || text.includes("gk") || text.includes("general studies")) return { key: "gk", shortName: "GK/GA" };
  if (text.includes("quant") || text.includes("math") || text.includes("numerical") || text.includes("aptitude")) return { key: "quant", shortName: "Maths" };
  if (text.includes("english") || text.includes("comprehension") || text.includes("language")) return { key: "english", shortName: "Eng." };
  if (text.includes("hindi")) return { key: "hindi", shortName: "Hindi" };
  
  const safeName = rawText ? rawText.replace(/Part \w :/, "").trim().substring(0, 15) : `Section ${index + 1}`;
  return { key: "other", shortName: safeName };
}

export async function POST(req: Request) {
  try {
    const { url, category, examId } = await req.json();

    if (!url || !examId) {
        return NextResponse.json({ error: "Missing URL or Exam ID" }, { status: 400 });
    }

    // --- STEP 1: FETCH PAGE 1 (Base Validation) ---
    const urls = getNormalizedUrls(url);
    
    // We use no-store to ensure we never cache a broken server response
    const mainResponse = await fetch(urls[0], { cache: 'no-store' });
    
    // We only hard-fail if Page 1 fails, because without Page 1, we have no candidate data.
    if (!mainResponse.ok) {
        return NextResponse.json({ error: "Answer key server is not responding. Please try again." }, { status: 502 });
    }
    
    const mainHtml = await mainResponse.text();
    const $check = cheerio.load(mainHtml);

    // Extract Roll Number to verify identity across pages
    let extractedRollNo = "";
    $check('td').each((_, element) => {
        if (extractedRollNo) return;
        const cellText = $check(element).text().replace(/\s+/g, ' ').trim();
        if (cellText.includes("Roll No") || cellText.includes("Participant ID") || cellText.includes("Application Number")) {
            extractedRollNo = $check(element).next().text().replace(':', '').trim();
        }
    });

    let rollNo = extractedRollNo;

    if (!rollNo) {
        const urlHash = crypto.createHash("md5").update(url).digest("hex").substring(0, 10);
        rollNo = `UNKN_${urlHash}`; 
        console.warn(`Roll number extraction failed. Using fallback: ${rollNo}`);
    }

    // --- STEP 2: CHECK DB CACHE ---
    const existingResult = await db.select().from(sscResults)
        .where(and(
            eq(sscResults.rollNo, rollNo),
            eq(sscResults.examId, examId)
        ))
        .limit(1);

    if (existingResult.length > 0) {
        const record = existingResult[0];
        
        // Bypass cache for Exam 90
        if (String(examId) === "90") { 
            console.log(`Bypassing cache to force recalculation for Exam 90 (Roll: ${rollNo})`);
        } else {
            if (category && record.category !== category) {
                await db.update(sscResults).set({ category }).where(eq(sscResults.id, record.id));
                record.category = category;
            }
            return NextResponse.json({ success: true, isCached: true, dbData: record });
        }
    }

    // --- STEP 3: PREPARE CALCULATION ---
    const examSettings = await db.query.recentExams.findFirst({
        where: eq(recentExams.id, examId),
    });

    if (!examSettings) {
        return NextResponse.json({ error: "Exam settings not found" }, { status: 404 });
    }

    const POSITIVE_MARK = examSettings.rightMark ?? 1;
    const NEGATIVE_MARK = examSettings.wrongMark ?? 0.25;

    // --- STEP 4: FETCH REMAINING PAGES (SIMULTANEOUS & FORGIVING) ---
    const validHtmlPages: string[] = [mainHtml];
    const mainPageLength = mainHtml.length;

    await Promise.all(
      urls.slice(1).map(async (u) => {
        try {
            const res = await fetch(u, { cache: 'no-store' });
            
            // FIX: If the server throws a 502/500/404 for this specific page, 
            // we just ignore it and return instead of stopping the whole calculation.
            if (!res.ok) return;
            
            const text = await res.text();
            
            // --- DEDUPLICATION CHECK ---
            if (text === mainHtml) return;
            const hasRollCheck = extractedRollNo ? text.includes(extractedRollNo) : true;
            if (Math.abs(text.length - mainPageLength) < 50 && hasRollCheck) return;
            
            validHtmlPages.push(text);
        } catch (e) {
            // FIX: Ignore network connection drops for secondary pages silently.
            return;
        }
      })
    );

    let totalCorrect = 0, totalWrong = 0, totalUnattempted = 0;
    
    const scoresMap: Record<string, number> = {
        reasoning: 0, gk: 0, quant: 0, english: 0, computer: 0, hindi: 0, other: 0
    };

    const detailedStats: any[] = [];

    // --- STEP 5: PROCESS EACH VALID PAGE ---
    validHtmlPages.forEach((html: string, index: number) => {
      if (!html) return;
      const $ = cheerio.load(html);
      
      let rawSubjectName = $('#lblsubject').text().trim(); 

      if (!rawSubjectName) {
         $('.header, strong, b').each((_, el) => {
            const t = $(el).text().trim();
            if (t.includes("Part") && t.includes(":")) rawSubjectName = t;
         });
      }

      const { key, shortName } = parseSubjectName(rawSubjectName, index);

      let sCorrect = 0, sWrong = 0, sUnattemptRaw = 0;

      $('td[bgcolor]').each((_, el) => {
        const color = $(el).attr('bgcolor')?.toLowerCase();
        if (color === 'green') sCorrect++;
        if (color === 'red') sWrong++;
        if (color === 'yellow') sUnattemptRaw++;
      });

      if (sCorrect === 0 && sWrong === 0 && sUnattemptRaw === 0) return;

      const sRealUnattempted = Math.max(0, sUnattemptRaw - sWrong); 
      const sectionScore = (sCorrect * POSITIVE_MARK) - (sWrong * NEGATIVE_MARK);
      
      if (scoresMap[key] !== undefined) {
          scoresMap[key] += sectionScore;
      } else {
          scoresMap['other'] += sectionScore;
      }

      totalCorrect += sCorrect;
      totalWrong += sWrong;
      totalUnattempted += sRealUnattempted;

      detailedStats.push({
          subject: shortName,
          fullSubjectName: rawSubjectName || shortName,
          right: sCorrect,
          wrong: sWrong,
          unattempted: sRealUnattempted,
          score: sectionScore
      });
    });

    const totalScore = (totalCorrect * POSITIVE_MARK) - (totalWrong * NEGATIVE_MARK);

    // --- STEP 6: METADATA EXTRACTION ---
    const extractText = (targetLabels: string[]) => {
      let foundValue = "";
      $check('td').each((_, element) => {
        if (foundValue) return;
        const cellText = $check(element).text().replace(/\s+/g, ' ').trim(); 
        if (targetLabels.some(label => cellText.includes(label))) {
           foundValue = $check(element).next().text().replace(':', '').trim();
        }
      });
      return foundValue;
    };

    const finalData = {
      examId: examId,
      category: category,
      rollNo: rollNo,
      candidateName: extractText(["Candidate Name", "Participant Name"]) || "Unknown Candidate",
      testDate: extractText(["Test Date"]) || "Unknown Date",
      testTimeShift: extractText(["Test Time"]) || "Unknown Time",
      centreName: extractText(["Centre Name", "Venue Name", "Test Center"]) || "Unknown Centre",
      answerKeyUrl: url.trim(),
      reasoningScore: scoresMap.reasoning,
      gkScore: scoresMap.gk,
      quantScore: scoresMap.quant,
      englishScore: scoresMap.english,
      totalScore: totalScore,
      sectionDetails: detailedStats 
    };

    // Save to DB
    await db.insert(sscResults)
      .values(finalData)
      .onConflictDoUpdate({
        target: [sscResults.rollNo, sscResults.examId],
        set: finalData
      });

    return NextResponse.json({ 
      success: true,
      isCached: false,
      score: totalScore, 
      correct: totalCorrect, 
      wrong: totalWrong, 
      dbData: finalData
    });

  } catch (error: any) {
    console.error("SSC Calc Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
