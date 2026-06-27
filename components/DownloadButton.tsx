"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";

interface Props {
  targetId: string;
  fileName: string;
}

export default function DownloadButton({ targetId, fileName }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = useCallback(async () => {
    const element = document.getElementById(targetId);
    if (!element) return;

    setIsLoading(true);

    try {
      // 1. Generate Image using the browser's native rendering
      const dataUrl = await toPng(element, {
        cacheBust: true,
        backgroundColor: "#ffffff", // Force white background
        pixelRatio: 2, // 2x quality (Retina)
        // This filter ensures we don't accidentally capture the download button itself 
        // if it were inside the target (it isn't in your case, but it's safe to have)
        filter: (node) => {
          return node.tagName !== "BUTTON"; 
        },
      });

      // 2. We need to draw the Watermark manually onto a Canvas 
      // because html-to-image is too accurate (it's hard to inject fake DOM elements mid-process)
      const img = new Image();
      img.src = dataUrl;
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
            setIsLoading(false);
            return;
        }

        // Set canvas dimensions to match the high-res image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the main screenshot
        ctx.drawImage(img, 0, 0);

        // --- DRAW WATERMARK ---
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-30 * Math.PI / 180); // -30 degree rotation
        ctx.font = "900 100px sans-serif"; // Large bold font
        ctx.fillStyle = "rgba(0, 0, 0, 0.04)"; // Very subtle grey
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("RANK MATTERS", 0, 0);
        ctx.restore();

        // 3. Trigger Download
        const finalUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = finalUrl;
        link.download = `${fileName.replace(/\s+/g, "_")}_Result.png`;
        link.click();
        
        setIsLoading(false);
      };

    } catch (error) {
      console.error("Failed to generate image:", error);
      setIsLoading(false);
    }
  }, [targetId, fileName]);

  return (
    <Button
      onClick={handleDownload}
      disabled={isLoading}
      size="sm"
      className="h-8 gap-2 text-xs uppercase tracking-wider font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all"
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Download className="w-3 h-3" />
      )}
      <span className="hidden sm:inline">
        {isLoading ? "Generating..." : "Download Result"}
      </span>
    </Button>
  );
}