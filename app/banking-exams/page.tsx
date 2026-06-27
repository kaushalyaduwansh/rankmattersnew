import Link from 'next/link';
import { db } from '@/db';
import { recentExams } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { ArrowRight, BarChart3, TrendingUp, Building2, Wallet } from 'lucide-react';
import Header from '@/components/header'; 
import Footer from '@/components/footer';

// --- 1. METADATA FOR SEO ---
export const metadata = {
  title: "Bank Exam Rank Predictor | RankMatters",
  description: "Check normalized marks and state-wise ranks for IBPS PO, Clerk, SBI PO, RBI Assistant and other Banking exams.",
};

// --- 2. FETCH ONLY BANK EXAMS ---
async function getBankExams() {
  const exams = await db.select()
    .from(recentExams)
    .where(eq(recentExams.type, 'BANK')) // <--- The Key Filter
    .orderBy(desc(recentExams.createdAt));
  return exams;
}

export default async function BankPage() {
  const exams = await getBankExams();

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 selection:bg-blue-100 flex flex-col">
      
      {/* Header */}
      <Header />

      <main className="pt-24 md:pt-36 flex-grow container mx-auto px-4 md:px-6 max-w-6xl">
        
        {/* --- BANK SPECIFIC HERO SECTION --- */}
        <div className="text-center mb-12 md:mb-20 space-y-4 md:space-y-6">
            {/* Blue Badge for Banking */}
            <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] md:text-xs font-bold uppercase tracking-widest animate-in fade-in zoom-in duration-500">
                <Building2 className="w-3 h-3 text-blue-600" /> 
                Banking & Insurance Exams
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] max-w-4xl mx-auto">
                Bank Exam Rank Predictor <br className="hidden md:block" />
                <span className="text-slate-400 font-medium text-2xl md:text-5xl block mt-1 md:mt-3">
                    IBPS • SBI • RBI • LIC
                </span>
            </h1>
            
            <p className="text-sm md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Get your normalized score and state-wise rank prediction.
                Compare yourself with thousands of aspirants across India.
            </p>
        </div>

        {/* --- EXAM CARDS GRID --- */}
        <div className="mb-20 md:mb-28">
            <div className="flex items-center justify-between mb-6 md:mb-8 px-1 border-b border-slate-100 pb-4">
                <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                        <Wallet className="h-5 w-5 text-blue-600" />
                    </span>
                    Active Banking Answer Keys
                </h2>
                
            </div>

            {/* GRID LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {exams.map((exam) => (
                    <ProfessionalCard key={exam.id} data={exam} />
                ))}
                
                {/* EMPTY STATE */}
                {exams.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                            <Building2 className="text-blue-400 w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">No Active Bank Keys</h3>
                        <p className="text-slate-500 text-sm mt-1">
                            Check back later for IBPS, SBI, or RBI answer keys.
                        </p>
                    </div>
                )}
            </div>
        </div>

      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// --- REUSED CARD COMPONENT (Customized for Bank - Blue Tint) ---
function ProfessionalCard({ data }: { data: any }) {
    return (
        <Link href={data.url} className="block h-full group">
            <div className="relative h-full bg-white rounded-xl p-4 border border-slate-100 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden flex flex-col justify-between">
                
                {/* Glow Effects (Blue tint for Bank) */}
                <div className="absolute -bottom-12 -right-12 w-32 h-32 opacity-[0.08] blur-[60px] pointer-events-none group-hover:opacity-[0.15] transition-opacity duration-500 z-0">
                     <img src={data.imageUrl} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                </div>
                <div className="absolute -bottom-16 -left-16 w-40 h-40 opacity-[0.10] blur-[70px] pointer-events-none group-hover:opacity-[0.18] transition-opacity duration-500 z-0">
                     <img src={data.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-xl bg-white border border-slate-100 p-2 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
                            <img src={data.imageUrl} alt={data.examName} className="w-full h-full object-contain mix-blend-multiply" />
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                             <div className="inline-flex self-start items-center gap-1.5 px-2 py-0.5 mb-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-bold tracking-wide">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                </span>
                                ACTIVE NOW
                            </div>

                            <h3 className="font-bold text-slate-900 text-base leading-tight truncate pr-1 group-hover:text-blue-600 transition-colors">
                                {data.examName}
                            </h3>
                            <p className="text-slate-500 text-xs font-medium mt-0.5">
                                Check State Rank
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Action Area */}
                <div className="relative z-10 mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-50 text-blue-700 uppercase tracking-wider border border-blue-100 transition-all duration-300">
                        {data.type}
                    </span>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        Analyze
                        <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </div>
                </div>
            </div>
        </Link>
    );
}