"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Loader2 } from "lucide-react";
import { toJpeg } from "html-to-image"; // 1. Imported toJpeg instead of toPng
import toast from "react-hot-toast";

interface ShareButtonProps {
  targetId: string;
  examName: string;
}

export default function ShareButton({ targetId, examName }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      const element = document.getElementById(targetId);
      if (!element) throw new Error("Result card not found");

      // 2. GENERATE SCREENSHOT AS JPG
      // Removed the forced 1024px width so it perfectly hugs the card 
      // without leaving any empty white space on the sides.
      const dataUrl = await toJpeg(element, {
        quality: 0.95, // Set JPG quality (0 to 1)
        pixelRatio: 2, // High resolution for crisp text
        backgroundColor: "#ffffff", 
      });

      // 3. CONVERT DATA URL TO FILE
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // 4. UPDATE EXTENSION AND MIME TYPE TO JPG
      const fileName = `${examName.replace(/\s+/g, "_")}_Scorecard.jpg`;
      const file = new File([blob], fileName, { type: "image/jpeg" });

      // 5. PREPARE NATIVE SHARE DATA
      const shareData = {
        title: `My ${examName} Scorecard`,
        text: `Check out my rank and score for the ${examName} on Rank Matters! 👇`,
        url: window.location.href, 
        files: [file],
      };

      // 6. TRIGGER NATIVE SHARE SHEET
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(shareData);
      } else {
        toast.error("File sharing isn't supported on this browser. Please download it instead.");
      }

    } catch (error) {
      console.error("Sharing error:", error);
      toast.error("Failed to generate shareable scorecard.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button
      onClick={handleShare}
      disabled={isSharing}
      size="sm"
      className="h-8 gap-2 text-xs uppercase tracking-wider font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all"
    >
      {isSharing ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Share2 className="w-3 h-3" />
      )}
      <span className="hidden sm:inline">
        {isSharing ? "Sharing..." : "Share Result"}
      </span>
    </Button>
  );
}