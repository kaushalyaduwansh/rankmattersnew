import crypto from "crypto";
import { db } from "@/db"; 
import { rrbResults } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * POST /api/calculate-rrb
 *
 * Receives pre-computed result data from the CLIENT (browser).
 * The browser fetches + parses the HTML itself, so this route
 * only handles caching/DB persistence — no external fetch needed.
 *
 * Expected body shape (matches what railway.tsx sends):
 * {
 *   examId, rollNo, candidateName, rrbZone, category,
 *   testDate, testTimeShift, centreName, answerKeyUrl,
 *   totalCorrect, totalWrong, totalUnattempted, totalScore,
 *   sectionDetails
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      examId,
      rollNo,
      candidateName,
      rrbZone,
      category,
      testDate,
      testTimeShift,
      centreName,
      answerKeyUrl,
      totalCorrect,
      totalWrong,
      totalUnattempted,
      totalScore,
      sectionDetails,
    } = body;

    if (!examId || !rollNo) {
      return NextResponse.json(
        { error: "Missing examId or rollNo" },
        { status: 400 }
      );
    }

    // Flag to bypass cache and force recalculation for exam ID 71
    const forceRecalculate = Number(examId) === 71;

    const dbData = {
      examId,
      rollNo,
      candidateName: candidateName || "Unknown Candidate",
      rrbZone: rrbZone || "Unknown",
      category: category || "UR",
      testDate: testDate || "Unknown Date",
      testTimeShift: testTimeShift || "Unknown Time",
      centreName: centreName || "Unknown Centre",
      answerKeyUrl: answerKeyUrl || "",
      totalCorrect: totalCorrect ?? 0,
      totalWrong: totalWrong ?? 0,
      totalUnattempted: totalUnattempted ?? 0,
      totalScore: totalScore ?? 0,
      sectionDetails: sectionDetails ?? [],
    };

    // --- Check for existing record ---
    const existingResult = await db
      .select()
      .from(rrbResults)
      .where(
        and(eq(rrbResults.rollNo, rollNo), eq(rrbResults.examId, examId))
      )
      .limit(1);

    if (existingResult.length > 0 && !forceRecalculate) {
      const record = existingResult[0];
      let needsUpdate = false;
      const updates: any = {};

      if (category && record.category !== category) {
        updates.category = category;
        needsUpdate = true;
      }

      if (rrbZone && record.rrbZone !== rrbZone) {
        updates.rrbZone = rrbZone;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await db
          .update(rrbResults)
          .set(updates)
          .where(eq(rrbResults.id, record.id));
        Object.assign(record, updates);
      }

      return NextResponse.json({
        success: true,
        isCached: true,
        dbData: record,
      });
    }

    // --- Save or Update DB ---
    if (existingResult.length > 0 && forceRecalculate) {
      await db
        .update(rrbResults)
        .set(dbData)
        .where(eq(rrbResults.id, existingResult[0].id));
    } else {
      await db.insert(rrbResults).values(dbData);
    }

    return NextResponse.json({
      success: true,
      isCached: false,
      dbData: dbData,
    });

  } catch (error: any) {
    console.error("RRB Save Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save result" },
      { status: 500 }
    );
  }
}