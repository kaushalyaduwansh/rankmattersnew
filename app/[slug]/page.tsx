import { notFound } from 'next/navigation';
import { db } from '@/db';
import { recentExams } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Metadata } from 'next';
import Link from 'next/link';

// --- IMPORT SHADCN BREADCRUMB ---
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// --- IMPORT YOUR CALCULATOR COMPONENTS ---
import CalculateSSC from '../calculate/page';
import CalculateRRB from '../calculate/railway';
import CalculateBank from '../calculate/bank';
import CalculateOthers from '../calculate/others';
import Header from '@/components/header';
import Footer from '@/components/footer';
import RollNumberLogin from '../calculate/rollnumberlogin';

// 1. IMPORT THE NEW RENDERER
import EditorRenderer from '../../components/ui/EditorRenderer'; 

type Props = {
  params: Promise<{ slug: string }>;
};

// 1. GENERATE DYNAMIC METADATA
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const exam = await getExamBySlug(slug);
  if (!exam) return { title: 'Page Not Found' };

  return {
    title: `Check Your ${exam.examName} Score - Rank Matters`,
    description: exam.description || `Calculate score and rank for ${exam.examName}`,
  };
}

// 2. FETCH DATA HELPER
async function getExamBySlug(slug: string) {
  try {
    const decodedSlug = decodeURIComponent(slug);
    const result = await db
      .select()
      .from(recentExams)
      .where(eq(recentExams.url, decodedSlug))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Database Fetch Error:", error);
    return null;
  }
}

// 3. MAIN PAGE COMPONENT
export default async function ExamPage({ params }: Props) {
  const { slug } = await params;
  const exam = await getExamBySlug(slug);

  if (!exam) {
    notFound();
  }

  // --- PARSE THE SAVED EDITOR.JS CONTENT ---
  let parsedContent = null;
  if (exam.examContent) { 
    try {
      const rawContent = exam.examContent as string | object;
      
      parsedContent = typeof rawContent === 'string' 
        ? JSON.parse(rawContent) 
        : rawContent;
    } catch (e) {
      console.error("Failed to parse Editor.js content from database:", e);
    }
  }

  // --- DYNAMIC COMPONENT SELECTION LOGIC ---
  let CalculatorComponent;
  const examType = exam.type ? exam.type.toUpperCase() : 'OTHERS';

  switch (examType) {
    case 'SSC':
      CalculatorComponent = <CalculateSSC examData={exam} />;
      break;
    case 'RAILWAY':  
    case 'RRB':      
      CalculatorComponent = <CalculateRRB examData={exam} />;
      break;
    case 'BANK':
    case 'BANKING':
      CalculatorComponent = <CalculateBank examData={exam}/>;
      break;
    default:
      CalculatorComponent = <CalculateOthers examData={exam} />;
      break;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <Header />

      <main className="flex-1 w-full pt-30 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 mt-[-30px] sm:mt-0">
          
          {/* --- DYNAMIC HEADER & BREADCRUMB --- */}
          {/* Updated: items-center and text-center applied to ALL screen sizes */}
          <div className="flex flex-col items-center text-center space-y-1 sm:space-y-3">
            
            {/* SHADCN BREADCRUMB: justify-center applied to ALL screen sizes */}
            <div className="w-full flex justify-center mb-2">
              <Breadcrumb>
                <BreadcrumbList className="text-[11px] sm:text-sm m-0 p-0">
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/">Home</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-muted-foreground font-medium">
                      {examType}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-semibold text-slate-800 truncate max-w-[150px] sm:max-w-xs">
                      {exam.examName}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Heading and paragraph are automatically centered due to the parent div */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mt-0">
              Check Your <span className="text-primary">{exam.examName}</span> Score
            </h1>
            <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto px-2">
              {exam.description || 'Enter your response sheet URL below to check your normalized score and rank.'}
            </p>
          </div>

          {/* --- DYNAMIC CALCULATOR RENDER --- */}
          <div className="w-full max-w-xl mx-auto mt-[-10px] sm:mt-[-20px]">
            {CalculatorComponent}
            <RollNumberLogin examUrl={exam.url} />
          </div>

          {/* --- EDITOR.JS RENDERER --- */}
          {parsedContent && (
            <div className="w-full">
              <EditorRenderer data={parsedContent} />
            </div>
          )}

        </div>
      </main>
      
      <Footer />
    </div>
  );
}