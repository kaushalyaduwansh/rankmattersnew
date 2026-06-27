"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn, Hash } from "lucide-react";

export default function RollNumberLogin({ examUrl }: { examUrl: string }) {
  const [rollNumber, setRollNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Exact brand color from your main calculator
  const brandColor = "lab(55 -44.44 -3.68 / 1)";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber.trim()) return;

    setLoading(true);
    router.push(`/${examUrl}/result?roll=${encodeURIComponent(rollNumber.trim())}`);
  };

  return (
    // Clean, flat #fff background with no outer borders or shadows
    <div className="w-full max-w-lg mx-auto px-4 py-8 mt-[-25px]">
      
      {/* Brand-specific focus styles */}
      <style jsx>{`
        .brand-focus:focus, 
        .brand-focus:focus-visible {
          border-color: ${brandColor} !important;
          box-shadow: 0 0 0 1px ${brandColor} !important;
          outline: none !important;
          ring: 0 !important;
        }
      `}</style>

      {/* Header Section - Left Aligned, Plain Background */}
      <div className="flex items-start gap-3 mb-8">
        {/* Simple icon placement without the boxed container */}
        <div className="flex-shrink-0 mt-0.5">
          <LogIn 
            className="h-6 w-6" 
            style={{ color: brandColor }}
          />
        </div>
        
        {/* Text Container */}
        <div className="flex flex-col">
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
            Login to check rank and score
          </h2>
          <p className="text-zinc-500 text-xs sm:text-sm mt-1">
            Login available for already checked candidate
          </p>
        </div>
      </div>

      {/* Form Section */}
      <form onSubmit={handleLogin} className="space-y-6">
        
        {/* Roll Number Input */}
        <div>
          <label className="block text-sm font-semibold text-zinc-800 mb-2">
            Roll Number
          </label>
          <div className="relative group">
            <div 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors"
              style={{ color: rollNumber ? brandColor : undefined }}
            >
              <Hash className="h-4 w-4" />
            </div>
            <Input
              placeholder="Enter your Roll No."
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              disabled={loading}
              // Slightly taller input (h-11) looks better on flat backgrounds
              className="brand-focus font-mono text-sm pl-9 bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 transition-all h-11 disabled:bg-zinc-50 disabled:text-zinc-400 rounded-lg"
              required
            />
          </div>
        </div>

        {/* Action Button */}
        <Button 
          className="w-full font-medium text-white transition-all h-11 rounded-lg hover:opacity-90 disabled:opacity-80"
          style={{ backgroundColor: brandColor }}
          disabled={loading || !rollNumber.trim()}
          type="submit"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>

      </form>
    </div>
  );
}