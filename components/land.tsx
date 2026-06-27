import Link from 'next/link';
import { db } from '@/db';
import { recentExams } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { BarChart3, Users, CheckCircle2, Globe2, Sparkles, TrendingUp } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import Footer from './footer';
import Header from './header';
import PaginatedGrid from './PaginatedGrid';

// --- SERVER ACTION ---
async function getRecentExams() {
  const exams = await db.select().from(recentExams).orderBy(desc(recentExams.createdAt));
  return exams;
}

export default async function LandingPage() {
  const exams = await getRecentExams();
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 selection:bg-indigo-100 flex flex-col">
      <Header/>

      <main className="pt-24 md:pt-36 flex-grow container mx-auto px-4 md:px-6 max-w-6xl">
        
        {/* --- HERO SECTION --- */}
        <div className="text-center mb-8 md:mb-20 space-y-4 md:space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] md:text-xs font-bold uppercase tracking-widest animate-in fade-in zoom-in duration-500">
                <Sparkles className="w-3 h-3 fill-indigo-600" />
                New Answer Keys Added
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] max-w-4xl mx-auto">
                Score Calculator <br className="hidden md:block" />
                <span className="text-slate-400 font-medium text-2xl md:text-5xl block mt-1 md:mt-3">
                    & Rank Predictor
                </span>
            </h1>
            
            <p className="text-sm md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Check your normalized marks and rank for online exams instantly.
            </p>
        </div>

        {/* --- EXAM CARDS SECTION --- */}
        <div className="mb-20 md:mb-28">
            <div className="flex items-center justify-between mb-6 md:mb-8 px-1">
                <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                    </span>
                    Recently Added Answer Keys
                </h2>
            </div>

            {/* DELEGATED TO CLIENT COMPONENT FOR ZERO-LAG PAGINATION */}
            <PaginatedGrid exams={exams} />
        </div>

        {/* --- SEO & INFO SECTION --- */}
        <div className="grid md:grid-cols-12 gap-12 mb-24 border-t border-slate-200 pt-16 md:pt-20">
            <div className="md:col-span-7 space-y-6 md:space-y-8">
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Why RankMatters?</h3>
                <p className="text-slate-600 leading-relaxed text-base md:text-lg">
                    We process thousands of student entries to provide the most statistically accurate rank prediction.
                    Our normalization logic mimics the actual commission formulas.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 pt-2">
                    {[
                        { icon: BarChart3, title: "Real-time Normalization", desc: "Dynamic shift-wise adjustment" },
                        { icon: Users, title: "Category-wise Ranks", desc: "See where you stand in your vertical" },
                        { icon: CheckCircle2, title: "Accuracy Assured", desc: "Algorithm verified with past results" },
                        { icon: Globe2, title: "All India Standing", desc: "Compare with 50,000+ students" },
                    ].map((feature, i) => (
                        <div key={i} className="flex gap-4 items-start group hover:bg-white p-3 rounded-xl transition-colors">
                            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition-colors">
                                <feature.icon className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm">{feature.title}</h4>
                                <p className="text-slate-500 text-xs mt-1">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="md:col-span-5 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-xl shadow-slate-100/50">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    🔥 Popular Searches
                </h3>
                <div className="flex flex-wrap gap-2.5">
                    {[
                        "SSC CGL Tier 1", "RRB NTPC", "Railway Group D",
                        "SSC CHSL", "Bihar SSC", "UP Police",
                        "CSIR ASO", "IBPS PO", "SBI Clerk"
                    ].map((tag, i) => (
                        <span key={i} className="px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg border border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 cursor-pointer transition-all">
                            {tag}
                        </span>
                    ))}
                </div>
                
                {/* --- DYNAMIC LATEST ACTIVITY --- */}
                <div className="mt-10 pt-8 border-t border-slate-100">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Latest Activity</p>
                     <div className="space-y-4">
                        {exams.length > 0 ? (
                            exams.slice(0, 2).map((exam) => (
                                <div key={exam.id} className="flex items-start gap-3">
                                    <div className="w-2 h-2 mt-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)] shrink-0"></div>
                                    <p className="text-sm text-slate-600">
                                        <span className="font-semibold text-slate-900">{exam.examName}</span> answer key is live.
                                        <Link href={`/${exam.url}`} className="text-indigo-500 hover:text-indigo-700 font-medium text-xs block mt-0.5 hover:underline decoration-indigo-200">
                                            Check your rank &rarr;
                                        </Link>
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 mt-2 bg-slate-300 rounded-full"></div>
                                <p className="text-sm text-slate-500">No recent updates.</p>
                            </div>
                        )}
                     </div>
                </div>
            </div>
        </div>

      </main>

      <Footer/>
    </div>
  );
}