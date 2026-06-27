"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  ArrowRight, 
  Hash, 
  Search, 
  ChevronDown, 
  MonitorCheck, 
  FileText 
} from "lucide-react";
import toast from "react-hot-toast";

interface ExamOption {
  name: string;
  url: string;
}

export default function LoginClient({ exams }: { exams: ExamOption[] }) {
  const [selectedExamUrl, setSelectedExamUrl] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Custom Dropdown Search States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Exact brand color from your main calculators
  const brandColor = "lab(55 -44.44 -3.68 / 1)";

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter exams based on search query
  const filteredExams = exams.filter(exam =>
    exam.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedExam = exams.find(e => e.url === selectedExamUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedExamUrl) {
      toast.error("Please select an exam first");
      return;
    }
    if (!rollNo.trim()) {
      toast.error("Please enter your roll number");
      return;
    }

    setLoading(true);
    const targetUrl = `/${selectedExamUrl}/result?roll=${encodeURIComponent(rollNo.trim())}`;
    router.push(targetUrl);
  };

  return (
    // Added mt-16 md:mt-20 to recreate that top spacing you requested
    <div className="w-full max-w-lg mx-auto border-zinc-200 shadow-sm rounded-xl px-8 py-8 p-20 md:py-12 bg-[#ffffff] mt-16 md:mt-20 ">
      
      {/* Brand-specific focus styles */}
      <style jsx>{`
        .brand-focus:focus, 
        .brand-focus:focus-visible {
          border-color: ${brandColor} !important;
          box-shadow: 0 0 0 1px ${brandColor} !important;
          outline: none !important;
          ring: 0 !important;
      .text-sm {
    margin-top: 5px;
        }
      `}</style>

      {/* Header Section - Centered Layout */}
      <div className="flex flex-col items-center text-center mb-8">
        {/* Placed icon in a subtle rounded wrapper for a polished centered look */}
        <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center shadow-sm mb-4">
          <MonitorCheck 
            className="h-6 w-6" 
            style={{ color: brandColor }}
          />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">
          Check Your Result
        </h2>
        <p className="text-zinc-500 text-xs sm:text-sm mt-1 max-w-[250px] sm:max-w-none">
          Search and select your exam to view your scorecard
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. Searchable Exam Dropdown */}
        <div className="w-full relative" ref={dropdownRef}>
          <label className="block text-sm font-semibold text-zinc-800 mb-2">
            Select Exam
          </label>
          
          {/* Custom Select Trigger */}
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center justify-between w-full h-11 px-3 bg-white border transition-all rounded-lg cursor-pointer select-none ${
              isDropdownOpen 
                ? `border-[${brandColor}]  ring-[${brandColor}]` 
                : "border-zinc-300 hover:border-zinc-400"
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText className="h-4 w-4 text-zinc-400 flex-shrink-0" style={{ color: selectedExamUrl ? brandColor : undefined }} />
              <span className={`truncate text-sm ${selectedExamUrl ? 'text-zinc-900 font-medium' : 'text-zinc-400'}`}>
                {selectedExam ? selectedExam.name : "Search and choose exam..."}
              </span>
            </div>
            <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
          </div>

          {/* Dropdown Menu with Search */}
          {isDropdownOpen && (
            <div className="absolute top-[72px] left-0 w-full z-50 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              {/* Search Input Area */}
              <div className="p-2 border-b border-zinc-100 bg-zinc-50/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    autoFocus
                    placeholder="Type to search exams..."
                    className="h-9 pl-9 text-sm bg-white border-zinc-200 brand-focus"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()} // Prevent closing when typing
                  />
                </div>
              </div>
              
              {/* Exam Options List */}
              <ul className="max-h-60 overflow-y-auto p-1">
                {filteredExams.length > 0 ? (
                  filteredExams.map((exam) => (
                    <li
                      key={exam.url}
                      onClick={() => {
                        setSelectedExamUrl(exam.url);
                        setIsDropdownOpen(false);
                        setSearchQuery(""); // Reset search after selection
                      }}
                      className={`px-3 py-2.5 text-sm rounded-md cursor-pointer transition-colors ${
                        selectedExamUrl === exam.url 
                          ? "bg-blue-50 text-blue-700 font-semibold" 
                          : "text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      {exam.name}
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-4 text-sm text-center text-zinc-500">
                    No exams found matching "{searchQuery}"
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* 2. Roll Number Input */}
        <div className="w-full">
          <label className="block text-sm font-semibold text-zinc-800 mb-2">
            Roll Number
          </label>
          <div className="relative group">
            <div 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors"
              style={{ color: rollNo ? brandColor : undefined }}
            >
              <Hash className="h-4 w-4" />
            </div>
            <Input 
              placeholder="Enter your Roll No."
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              disabled={loading}
              className="brand-focus font-mono text-sm pl-9 bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 transition-all h-11 disabled:bg-zinc-50 disabled:text-zinc-400 rounded-lg w-full"
              required
            />
          </div>
        </div>

        {/* 3. Submit Button */}
        <Button 
          type="submit" 
          disabled={loading || !selectedExamUrl || !rollNo.trim()}
          className="w-full h-11 font-medium text-white transition-all rounded-lg hover:opacity-90 disabled:opacity-80 mt-2"
          style={{ backgroundColor: brandColor }}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fetching Result...
            </>
          ) : (
            <>
              View Result <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

      </form>
    </div>
  );
}