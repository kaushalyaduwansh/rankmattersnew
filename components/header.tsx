import Link from 'next/link';
import Script from 'next/script'; // <-- 1. Import Next.js Script
import { db } from '@/db';
import { recentExams } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { auth } from '@clerk/nextjs/server';
import { Send, LogIn, LayoutDashboard } from 'lucide-react';
import NavLink from '@/components/nav-link';

// --- SERVER ACTION ---
async function getRecentExams() {
  const exams = await db.select().from(recentExams).orderBy(desc(recentExams.createdAt));
  return exams;
}

export default async function Header() {
  const exams = await getRecentExams();
  const { userId } = await auth();

  const LOGO_URL = "https://res.cloudinary.com/diyjz7pvk/image/upload/v1766663877/Rank_m7ctpr.png"; 

  return (
    <div className="">
      
      {/* --- 2. GOOGLE ANALYTICS SCRIPTS --- */}
      <Script 
        strategy="afterInteractive" 
        src="https://www.googletagmanager.com/gtag/js?id=G-EJCQD4K7PH" 
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-EJCQD4K7PH');
        `}
      </Script>

      <Script
  async
  strategy="afterInteractive"
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4719035687658379"
  crossOrigin="anonymous"
/>

      {/* --- HEADER --- */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 transition-all duration-300 h-16 md:h-20">
        <div className="container mx-auto px-4 md:px-6 h-full flex items-center justify-between ">
            
            {/* 1. Logo Section */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                <div className="h-8 md:h-10 w-auto">
                    <img 
                      src={LOGO_URL} 
                      alt="RankMatters Logo" 
                      className="h-full w-auto object-contain"
                    />
                </div>
            </Link>

            {/* 2. Navigation (Desktop Center) */}
            <div className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-full border border-slate-200/60 backdrop-blur-md absolute left-1/2 -translate-x-1/2">
                <NavLink href="/">Home</NavLink>
                <NavLink href="/about">About</NavLink>
                <NavLink href="/contact">Contact</NavLink>
                {/* Only show Login in center nav if NOT logged in */}
                {!userId && <NavLink href="/login">Login</NavLink>}
            </div>
            
            {/* 3. Right Side: Telegram + Auth Actions */}
            <div className="flex items-center gap-2 md:gap-3">
                
                {/* Telegram Button */}
                <Link 
                    href="https://t.me/rankmatters" 
                    target="_blank"
                    className="group flex items-center gap-2 bg-[#229ED9] hover:bg-[#1A8LB8] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(34,158,217,0.4)] hover:-translate-y-0.5 active:scale-95"
                >
                    <Send className="w-3.5 h-3.5 md:w-4 md:h-4 fill-white/20 stroke-[2.5px] group-hover:-rotate-12 transition-transform duration-300" />
                    <span className="text-xs md:text-sm font-semibold">
                        <span className="hidden sm:inline">Join Channel</span>
                        <span className="sm:hidden">Telegram</span>
                    </span>
                </Link>

                {/* --- AUTHENTICATION LOGIC --- */}
                
                {userId ? (
                   // LOGGED IN STATE
                   <>
                       {/* Desktop Dashboard */}
                       <Link href="/dashboard" className="hidden md:inline-flex text-sm font-medium text-indigo-600 bg-white border border-indigo-100 shadow-sm px-4 py-2 rounded-full hover:text-indigo-700 hover:bg-indigo-50 transition-all">
                          Dashboard
                       </Link>

                       {/* Mobile Dashboard Icon */}
                       <Link href="/dashboard" className="md:hidden">
                           <Button size="icon" variant="ghost" className="rounded-full text-indigo-600 bg-indigo-50 border border-indigo-100/50 h-9 w-9 shadow-sm">
                               <LayoutDashboard className="w-4 h-4" />
                           </Button>
                       </Link>
                   </>
                ) : (
                   // LOGGED OUT STATE (Mobile Login Button)
                   <Link 
                       href="/login" 
                       className="md:hidden flex items-center gap-2 bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-full transition-all duration-300 active:scale-95"
                   >
                       <LogIn className="w-3.5 h-3.5" />
                       <span className="text-xs font-bold">Login</span>
                   </Link>
                )}

            </div>
        </div>
      </nav>
    </div>
  );
}
