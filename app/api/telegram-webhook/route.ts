import { NextResponse } from "next/server";
import { db } from "@/db"; 
import { recentExams } from "@/db/schema"; 

// Helper to generate 3 random lowercase letters
function getRandomSuffix() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: Request) {
  try {
    // 1. Security Check
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    let { exam_name, type, description, image_url, url, total_questions, right_mark, wrong_mark } = body;

    // 2. Retry Logic for Duplicate URLs
    let isSaved = false;
    let attempts = 0;
    
    // We try up to 5 times to find a unique URL
    while (!isSaved && attempts < 5) {
      try {
        await db.insert(recentExams).values({
          examName: exam_name,
          type: type, 
          description: description,
          imageUrl: image_url,
          url: url, // Uses the current version of 'url'
          totalQuestions: total_questions,
          rightMark: right_mark,
          wrongMark: wrong_mark,
        });
        isSaved = true; // Success! Break the loop
      } catch (error: any) {
        // Postgres Error Code '23505' means "Unique Constraint Violation" (Duplicate URL)
        if (error.code === '23505') {
          console.log(`⚠️ URL '${url}' exists. Generating suffix...`);
          // Append random 3 chars: "ssc-cgl-2025" -> "ssc-cgl-2025-abc"
          url = `${body.url}-${getRandomSuffix()}`; 
          attempts++;
        } else {
          throw error; // If it's a different error (like DB connection), crash properly
        }
      }
    }

    if (!isSaved) {
      return NextResponse.json({ success: false, message: "Could not generate unique URL after 5 attempts" }, { status: 409 });
    }

    return NextResponse.json({ success: true, message: "Exam Added", finalUrl: url });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}