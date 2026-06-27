"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export default function PaginatedGrid({ exams }: { exams: any[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  
  const totalPages = Math.ceil(exams.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentExams = exams.slice(startIndex, startIndex + itemsPerPage);

  // Smooth scroll slightly down from the top to align the grid into view
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 400, behavior: "smooth" }); 
  };

  if (exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 mx-4 md:mx-0">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <BarChart3 className="text-slate-300 w-8 h-8" />
        </div>
        <p className="text-slate-500 font-medium">No active answer keys found.</p>
      </div>
    );
  }

  return (
    <div>
      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-0">
        {currentExams.map((exam) => (
          <ProfessionalCard key={exam.id} data={exam} />
        ))}
      </div>

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-8 md:mt-10 animate-in fade-in duration-500 px-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center flex-wrap justify-center gap-1 sm:gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                  currentPage === page
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

// --- RESPONSIVE CARD ---
function ProfessionalCard({ data }: { data: any }) {
  return (
    <Link 
      href={`/${data.url}`} 
      // active:scale-[0.98] is placed on the Link so the tap triggers immediately on mobile
      className="block h-full group active:scale-[0.98] md:active:scale-100 transition-transform duration-200 ease-out will-change-transform"
    >
      
      {/* =========================================
          MOBILE VERSION (< 768px)
          ========================================= */}
      <div className="md:hidden relative h-full bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col justify-between">
        
        {/* Mobile Background Glows */}
        <div className="absolute -bottom-10 -right-10 w-32 h-32 opacity-[0.12] blur-[50px] pointer-events-none z-0">
          <img src={data.imageUrl} alt="" className="w-full h-full object-cover" aria-hidden="true" />
        </div>
        <div className="absolute -top-10 -left-10 w-32 h-32 opacity-[0.08] blur-[50px] pointer-events-none z-0">
          <img src={data.imageUrl} alt="" className="w-full h-full object-cover" aria-hidden="true" />
        </div>

        {/* Mobile Top Content */}
        <div className="relative z-10 p-4 flex-1 flex flex-col">
          <div className="flex items-start gap-3.5">
            
            {/* Icon */}
            <div className="w-12 h-12 shrink-0 rounded-xl bg-white border border-slate-100 p-2 flex items-center justify-center shadow-sm">
              <img
                src={data.imageUrl}
                alt={data.examName}
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>
            
            {/* Text & Badge */}
            <div className="flex-1 min-w-0 flex flex-col items-start pt-0.5">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mb-1.5 rounded-full bg-emerald-50 border border-emerald-100/50 text-emerald-700 text-[9px] font-extrabold tracking-wider uppercase shadow-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Active
              </div>
              
              <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2">
                {data.examName}
              </h3>
              <p className="text-slate-500 text-[11px] font-medium mt-1">
                Check Score & Rank
              </p>
            </div>
          </div>
        </div>

        {/* Mobile App-like Bottom Bar */}
        <div className="relative z-10 bg-slate-50/70 px-4 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-white shadow-sm text-slate-500 uppercase tracking-wider border border-slate-100">
            {data.type}
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold shadow-sm">
            Analyze
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>


      {/* =========================================
          DESKTOP VERSION (>= 768px)
          Exactly your original design.
          ========================================= */}
      <div className="hidden md:flex relative h-full bg-white rounded-xl p-4 border border-slate-100 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden flex-col justify-between">
        
        {/* Background Glows */}
        <div className="absolute -bottom-12 -right-12 w-32 h-32 opacity-[0.08] blur-[60px] pointer-events-none group-hover:opacity-[0.15] transition-opacity duration-500 will-change-transform z-0">
          <img src={data.imageUrl} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" aria-hidden="true" />
        </div>
        <div className="absolute -bottom-16 -left-16 w-40 h-40 opacity-[0.10] blur-[70px] pointer-events-none group-hover:opacity-[0.18] transition-opacity duration-500 will-change-transform z-0">
          <img src={data.imageUrl} alt="" className="w-full h-full object-cover" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 shrink-0 rounded-xl bg-white border border-slate-100 p-2 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
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
              <h3 className="font-bold text-slate-900 text-base leading-tight truncate pr-1 group-hover:text-indigo-600 transition-colors">
                {data.examName}
              </h3>
              <p className="text-slate-500 text-xs font-medium mt-0.5">Check Score & Rank</p>
            </div>
          </div>
        </div>

        {/* Bottom Action Area */}
        <div className="relative z-10 mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
          <span className={`text-[10px] font-bold px-2 py-1 rounded bg-slate-50 text-slate-500 uppercase tracking-wider border border-slate-100 ${data.type === 'SSC' ? 'group-hover:bg-orange-50 group-hover:text-orange-700 group-hover:border-orange-100' : 'group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-100'} transition-all duration-300`}>
            {data.type}
          </span>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
            Analyze <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>

    </Link>
  );
}