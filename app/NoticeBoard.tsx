"use client";

import { usePathname } from "next/navigation";

export default function NoticeBoard() {
  const pathname = usePathname();

  // The specific path where the notice should appear
  const targetPath = "/rrb-technician-grade-1-2025-26-score-calculator/result";

  // If the current URL doesn't match the target, don't render anything
  if (pathname !== targetPath) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto my-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg shadow-sm p-4 flex items-start space-x-4">
        {/* Alert Icon */}
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-amber-500 mt-0.5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Notice Content */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-800 tracking-wide uppercase">
            Important Notice Regarding Answer Keys
          </h3>
          <div className="mt-1 text-sm text-amber-700 leading-relaxed">
            <p>
              Please do not panic if your score seems lower than expected. Widespread discrepancies have been reported in the preliminary answer key released by RRB/TCS. 
              <br className="hidden sm:block" />
              We strongly advise waiting for the officially corrected answer key to verify your final score.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}