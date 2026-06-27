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
    baseUrl, // Page 1 (Index 0) - Qualifying
    baseUrl.replace("ViewCandResponse", "ViewCandResponse2"), // Page 2 (Index 1) - Qualifying
    baseUrl.replace("ViewCandResponse", "ViewCandResponse3"), // Page 3 (Index 2) - Merit
    baseUrl.replace("ViewCandResponse", "ViewCandResponse4"), // Page 4 (Index 3) - Merit
    baseUrl.replace("ViewCandResponse", "ViewCandResponse5"), // Page 5 (Index 4) - Merit
    baseUrl.replace("ViewCandResponse", "ViewCandResponse6"), // Page 6 (Index 5) - Merit
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
    const mainResponse = await fetch(urls[0], { next: { revalidate: 3600 } });
    
    if (!mainResponse.ok) {
        return NextResponse.json({ error: "Failed to fetch answer key" }, { status: 400 });
    }
    
    const mainHtml = await mainResponse.text();
    const $check = cheerio.load(mainHtml);

    let rollNo = "";
    $check('td').each((_, element) => {
        if (rollNo) return;
        const cellText = $check(element).text().replace(/\s+/g, ' ').trim();
        if (cellText.includes("Roll No")) {
            rollNo = $check(element).next().text().replace(':', '').trim();
        }
    });

    if (!rollNo) {
        return NextResponse.json({ error: "Could not find Roll Number" }, { status: 422 });
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
        if (category && record.category !== category) {
            await db.update(sscResults).set({ category }).where(eq(sscResults.id, record.id));
            record.category = category;
        }
        return NextResponse.json({ success: true, isCached: true, dbData: record });
    }

    // --- STEP 3: PREPARE CALCULATION ---
    const examSettings = await db.query.recentExams.findFirst({
        where: eq(recentExams.id, examId),
    });

    if (!examSettings) {
        return NextResponse.json({ error: "Exam settings not found" }, { status: 404 });
    }

    const POSITIVE_MARK = examSettings.rightMark ?? 1;
    const DB_NEGATIVE_MARK = examSettings.wrongMark ?? 0.25;

    // --- STEP 4: FETCH REMAINING PAGES WITH TRACKING ---
    // We now track the pageIndex so we know which URL generated which HTML
    const validPages: { html: string; pageIndex: number }[] = [];
    validPages.push({ html: mainHtml, pageIndex: 0 }); 
    
    const mainPageLength = mainHtml.length;

    await Promise.all(
      urls.slice(1).map(async (u, idx) => {
        const actualPageIndex = idx + 1; // map back to original urls array index
        try {
            const res = await fetch(u, { next: { revalidate: 3600 } });
            if (!res.ok) return;
            const text = await res.text();
            
            if (text === mainHtml) return;
            if (Math.abs(text.length - mainPageLength) < 50 && text.includes(rollNo)) return;
            
            validPages.push({ html: text, pageIndex: actualPageIndex });
        } catch (e) {
            // Ignore 404s
        }
      })
    );

    // Sort to ensure Page 1 and Page 2 are processed in correct order
    validPages.sort((a, b) => a.pageIndex - b.pageIndex);

    let totalCorrect = 0, totalWrong = 0, totalUnattempted = 0;
    let finalTotalScore = 0; // We will accumulate this section by section
    
    const scoresMap: Record<string, number> = {
        reasoning: 0, gk: 0, quant: 0, english: 0, computer: 0, hindi: 0, other: 0
    };

    const detailedStats: any[] = [];

    // --- STEP 5: PROCESS EACH VALID PAGE ---
    validPages.forEach((page) => {
      const { html, pageIndex } = page;
      if (!html) return;
      const $ = cheerio.load(html);
      
      let rawSubjectName = $('#lblsubject').text().trim(); 

      if (!rawSubjectName) {
         $('.header, strong, b').each((_, el) => {
            const t = $(el).text().trim();
            if (t.includes("Part") && t.includes(":")) rawSubjectName = t;
         });
      }

      const { key, shortName } = parseSubjectName(rawSubjectName, pageIndex);

      let sCorrect = 0, sWrong = 0, sUnattemptRaw = 0;

      $('td[bgcolor]').each((_, el) => {
        const color = $(el).attr('bgcolor')?.toLowerCase();
        if (color === 'green') sCorrect++;
        if (color === 'red') sWrong++;
        if (color === 'yellow') sUnattemptRaw++;
      });

      if (sCorrect === 0 && sWrong === 0 && sUnattemptRaw === 0) return;

      // --- DYNAMIC NEGATIVE MARKING LOGIC ---
      // Index 0 (ViewCandResponse) and Index 1 (ViewCandResponse2) are qualifying (0 negative)
      const isQualifying = pageIndex === 0 || pageIndex === 1;
      const currentNegativeMark = isQualifying ? 0 : DB_NEGATIVE_MARK;

      const sRealUnattempted = Math.max(0, sUnattemptRaw - sWrong); 
      
      // Calculate score using dynamic negative mark
      const sectionScore = (sCorrect * POSITIVE_MARK) - (sWrong * currentNegativeMark);
      
      if (scoresMap[key] !== undefined) {
          scoresMap[key] += sectionScore;
      } else {
          scoresMap['other'] += sectionScore;
      }

      totalCorrect += sCorrect;
      totalWrong += sWrong;
      totalUnattempted += sRealUnattempted;
      finalTotalScore += sectionScore; // Add to final score

      detailedStats.push({
          subject: shortName, 
          fullSubjectName: rawSubjectName || shortName,
          isQualifying: isQualifying, // Passed to frontend
          right: sCorrect,
          wrong: sWrong,
          unattempted: sRealUnattempted,
          score: sectionScore
      });
    });

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
      candidateName: extractText(["Candidate Name"]),
      testDate: extractText(["Test Date"]),
      testTimeShift: extractText(["Test Time"]),
      centreName: extractText(["Centre Name", "Venue Name"]),
      answerKeyUrl: url.trim(),
      
      reasoningScore: scoresMap.reasoning,
      gkScore: scoresMap.gk,
      quantScore: scoresMap.quant,
      englishScore: scoresMap.english,
      
      totalScore: finalTotalScore, // Use our newly accumulated score
      sectionDetails: detailedStats 
    };

    await db.insert(sscResults)
      .values(finalData)
      .onConflictDoUpdate({
        target: [sscResults.rollNo, sscResults.examId],
        set: finalData
      });

    return NextResponse.json({ 
      success: true,
      isCached: false,
      score: finalTotalScore, 
      correct: totalCorrect, 
      wrong: totalWrong, 
      dbData: finalData
    });

  } catch (error: any) {
    console.error("SSC Calc Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}