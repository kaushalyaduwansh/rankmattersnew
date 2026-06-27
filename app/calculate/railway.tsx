"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Link as LinkIcon,
  Users,
  CheckCircle2,
  MapPin,
  ClipboardPaste,
  X,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import Loading from "../[slug]/result/loading";

const RRB_ZONES = [
  "Ahmedabad", "Ajmer", "Allahabad", "Bangalore", "Bhopal",
  "Bhubaneswar", "Bilaspur", "Chandigarh", "Chennai", "Gorakhpur",
  "Guwahati", "Jammu-Srinagar", "Kolkata", "Malda", "Mumbai",
  "Muzaffarpur", "Patna", "Ranchi", "Secunderabad", "Siliguri",
  "Thiruvananthapuram",
];

// ---------------------------------------------------------------------------
// CLIENT-SIDE HTML PARSER  (runs in browser via DOMParser)
// ---------------------------------------------------------------------------
function parseRRBHtml(
  html: string,
  url: string,
  category: string,
  zone: string,
  examId: number
) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const extractInfo = (label: string): string => {
    const rows = doc.querySelectorAll(".main-info-pnl table tr");
    for (const row of Array.from(rows)) {
      const tds = row.querySelectorAll("td");
      if (tds.length >= 2) {
        const cellText = tds[0].textContent?.trim() ?? "";
        if (new RegExp(label, "i").test(cellText)) {
          return tds[1].textContent?.trim() ?? "";
        }
      }
    }
    return "";
  };

  let rollNo =
    extractInfo("Roll Number") ||
    extractInfo("Participant ID") ||
    extractInfo("Candidate Roll No.") ||
    extractInfo("Application Number") ||
    extractInfo("Hall Ticket No") ||
    extractInfo("Registration Number") ||
    extractInfo("Seat Number") ||
    extractInfo("Examinee ID") ||
    extractInfo("Candidate ID") ||
    extractInfo("Roll No") ||
    extractInfo("Roll #") ||
    extractInfo("Roll") ||
    extractInfo("ID Number") ||
    extractInfo("Examinee Number");

  if (!rollNo) {
    let hash = 0;
    for (let i = 0; i < url.length; i++)
      hash = (Math.imul(31, hash) + url.charCodeAt(i)) | 0;
    rollNo = `UNKN_${Math.abs(hash).toString(16).substring(0, 10)}`;
    console.warn("Roll number extraction failed. Fallback:", rollNo);
  }

  const candidateName =
    extractInfo("Candidate Name") || extractInfo("Participant Name") || "Unknown Candidate";
  const testDate  = extractInfo("Test Date")  || "Unknown Date";
  const testTime  = extractInfo("Test Time")  || "Unknown Time";
  const centreName =
    extractInfo("Test Center Name") ||
    extractInfo("Test Center") ||
    extractInfo("Test Venue") ||
    extractInfo("Test Centre Name") ||
    "Unknown Centre";

  const sections: { subject: string; right: number; wrong: number; unattempted: number; score: number }[] = [];

  for (const sectionElem of Array.from(doc.querySelectorAll(".section-cntnr"))) {
    const sectionName =
      sectionElem.querySelector(".section-lbl .bold")?.textContent?.trim() || "General";
    let secRight = 0, secWrong = 0, secUnattempted = 0;

    for (const qElem of Array.from(sectionElem.querySelectorAll(".question-pnl"))) {
      let correctOptionIndex = "";
      for (const rightElem of Array.from(qElem.querySelectorAll(".rightAns"))) {
        const m = rightElem.textContent?.trim().match(/^([a-zA-Z0-9]+)\./);
        if (m) { correctOptionIndex = m[1].toUpperCase(); break; }
      }

      let chosenOption = "";
      const menuTable = qElem.querySelector(".menu-tbl");
      if (menuTable) {
        for (const row of Array.from(menuTable.querySelectorAll("tr"))) {
          const tds = row.querySelectorAll("td");
          if (tds[0]?.textContent?.includes("Chosen Option")) {
            const val = tds[1]?.textContent?.trim() ?? "";
            if (val !== "--" && val !== "") chosenOption = val.toUpperCase();
          }
        }
      }

      if (chosenOption === "") secUnattempted++;
      else if (correctOptionIndex && chosenOption === correctOptionIndex) secRight++;
      else secWrong++;
    }

    sections.push({
      subject: sectionName,
      right: secRight,
      wrong: secWrong,
      unattempted: secUnattempted,
      score: parseFloat((secRight - secWrong / 3).toFixed(4)),
    });
  }

  const totalCorrect    = sections.reduce((a, c) => a + c.right, 0);
  const totalWrong      = sections.reduce((a, c) => a + c.wrong, 0);
  const totalUnattempted = sections.reduce((a, c) => a + c.unattempted, 0);
  const finalScore      = parseFloat((totalCorrect - totalWrong / 3).toFixed(4));

  return {
    examId, rollNo, candidateName,
    rrbZone: zone || "Unknown", category,
    testDate, testTimeShift: testTime, centreName,
    answerKeyUrl: url,
    totalCorrect, totalWrong, totalUnattempted,
    totalScore: finalScore, sectionDetails: sections,
  };
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function CalculateRRB({ examData }: { examData: any }) {
  const [inputUrl, setInputUrl] = useState("");
  const [category, setCategory] = useState("UR");
  const [zone, setZone]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [showHtmlInput, setShowHtmlInput] = useState(false);
  const [htmlSource, setHtmlSource] = useState("");
  const router = useRouter();

  const brandColor = "lab(55 -44.44 -3.68 / 1)";

  // --- Clipboard helpers ---
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) { setInputUrl(text); toast.success("URL pasted!"); }
    } catch {
      toast.error("Clipboard access denied. Please paste manually.");
    }
  };

  const handleClear = () => setInputUrl("");

  const handlePasteHtml = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) { setHtmlSource(text); toast.success("HTML source pasted!"); }
    } catch {
      toast.error("Clipboard access denied. Please paste manually.");
    }
  };

  const handleClearHtml = () => setHtmlSource("");

  // --- Main submit ---
  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!zone) {
      toast.error("Please select your RRB Zone");
      return;
    }

    if (showHtmlInput) {
      if (htmlSource.trim().length < 500) {
        toast.error("Please paste the complete HTML source code of the response page.");
        return;
      }
      setLoading(true);
      setStatusMsg("Calculating your score…");
      try {
        const computedData = parseRRBHtml(htmlSource, "MANUAL_HTML_UPLOAD", category, zone, examData.id);
        setStatusMsg("Saving results…");
        const response = await fetch("/api/calculate-rrb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(computedData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to save result");

        toast.success("Score Calculated Successfully!");
        router.push(`/${examData.url}/result?roll=${data.dbData.rollNo}`);
      } catch (err: any) {
        setLoading(false);
        setStatusMsg("");
        toast.error(err.message || "Failed to parse HTML source. Make sure it's the correct page source.");
      }
      return;
    }

    if (!inputUrl.includes("http")) {
      toast.error("Please paste a valid URL starting with http/https");
      return;
    }

    setLoading(true);
    setStatusMsg("Fetching your response sheet…");

    try {
      // --- Fetch Strategy ---
      //
      // Tier 1: Your Cloudflare Worker (Indian PoP, sends correct Referer — most reliable)
      // Tier 2: Our server proxy (fallback if Worker is down)
      // Tier 3: corsproxy.io (last resort)
      //
      let html = "";

      // Your own Cloudflare Worker URL
      const CF_WORKER = "https://delicate-morning-9d02.kkbharti555.workers.dev/";

      const cfProxy     = `${CF_WORKER}?url=${encodeURIComponent(inputUrl)}`;
      const serverProxy = `/api/proxy-html?url=${encodeURIComponent(inputUrl)}`;
      const corsProxy   = `https://corsproxy.io/?url=${encodeURIComponent(inputUrl)}`;

      // Helper: try a URL, return text on success or null on failure
      const tryFetch = async (proxyUrl: string, name: string): Promise<string | null> => {
        try {
          console.log(`[Fetch] Trying proxy ${name}: ${proxyUrl}`);
          const res = await fetch(proxyUrl, { cache: "no-store" });
          console.log(`[Fetch] Proxy ${name} status: ${res.status}`);
          if (!res.ok) {
            const errText = await res.text().catch(() => "");
            console.error(`[Fetch] Proxy ${name} failed:`, errText);
            return null;
          }
          const text = await res.text();
          console.log(`[Fetch] Proxy ${name} success, length: ${text.length}`);
          // A valid RRB response sheet page always has substantial HTML
          return text.trim().length > 200 ? text : null;
        } catch (err: any) {
          console.error(`[Fetch] Proxy ${name} error:`, err);
          return null;
        }
      };

      setStatusMsg("Fetching response sheet (Worker)…");
      html = (await tryFetch(cfProxy, "Cloudflare Worker")) ?? "";

      if (!html) {
        setStatusMsg("Trying alternate connection (Server)…");
        html = (await tryFetch(serverProxy, "Server Proxy")) ?? "";
      }

      if (!html) {
        setStatusMsg("Connecting via backup route (CORS Proxy)…");
        html = (await tryFetch(corsProxy, "CORS Proxy")) ?? "";
      }

      if (!html) {
        throw new Error(
          "Could not load response sheet. Check console logs for details, or try copying a fresh link from the RRB portal."
        );
      }

      // STEP 2 — parse + calculate on device
      setStatusMsg("Calculating your score…");
      const computedData = parseRRBHtml(html, inputUrl, category, zone, examData.id);

      // STEP 3 — save to DB
      setStatusMsg("Saving results…");
      const response = await fetch("/api/calculate-rrb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(computedData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save result");

      toast.success("Score Calculated Successfully!");
      router.push(`/${examData.url}/result?roll=${data.dbData.rollNo}`);
      // Keep overlay visible during navigation

    } catch (err: any) {
      setLoading(false);
      setStatusMsg("");
      toast.error(err.message || "Error checking result. Please check the URL.");
    }
  };

  // --- LOADING SCREEN (original skeleton) ---
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F8F9FA] overflow-y-auto py-6 px-3 md:py-8 md:px-6">
        {statusMsg && (
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-500 pt-3 mb-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}
        <Loading />
      </div>
    );
  }

  // --- FORM ---
  return (
    <div className="w-full max-w-lg mx-auto px-4 py-8">
      <style jsx>{`
        .brand-focus:focus,
        .brand-focus:focus-visible,
        .brand-focus[data-state="open"] {
          border-color: ${brandColor} !important;
          box-shadow: 0 0 0 1px ${brandColor} !important;
          outline: none !important;
        }
      `}</style>

      <Card className="bg-white border border-zinc-200 shadow-sm rounded-xl overflow-hidden p-0">

        {/* ── Header ── */}
        <div className="bg-zinc-50 border-b border-zinc-100 pt-8 pb-6 text-center rounded-t-xl">
          <div className="mx-auto w-12 h-12 bg-white border border-zinc-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <CheckCircle2 className="h-6 w-6" style={{ color: brandColor }} />
          </div>
          <CardTitle className="text-2xl font-bold text-zinc-900 tracking-tight">
            RRB Score Calculator
          </CardTitle>
          <CardDescription className="text-zinc-500 text-sm mt-2">
            Enter your response sheet details below
          </CardDescription>
        </div>

        {/* ── Form ── */}
        <CardContent className="p-6 md:p-8 space-y-6 bg-white">
          <form onSubmit={handleCalculate} className="space-y-6">

            {/* URL/HTML Selector Toggle */}
            <div className="flex justify-end -mb-2">
              <button
                type="button"
                onClick={() => {
                  setShowHtmlInput(!showHtmlInput);
                  // Clear error state or input variables
                  setInputUrl("");
                  setHtmlSource("");
                }}
                className="text-xs font-semibold text-zinc-500 hover:text-emerald-700 underline transition-all"
              >
                {showHtmlInput ? "← Use Response Sheet URL instead" : "Paste Page HTML manually fallback"}
              </button>
            </div>

            {/* 1. URL Input with Paste / Clear OR HTML Source Textarea */}
            {!showHtmlInput ? (
              <div>
                <label className="block text-sm font-semibold text-zinc-800 mb-2 ml-1">
                  Response Sheet URL
                </label>
                <div className="relative flex items-center">
                  {/* Left icon */}
                  <div
                    className="absolute left-3 pointer-events-none z-10"
                    style={{ color: inputUrl ? brandColor : "#a1a1aa" }}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </div>

                  <Input
                    placeholder="Paste your RRB response sheet URL here…"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="brand-focus font-mono text-xs pl-10 pr-24 bg-zinc-50/50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 transition-all h-11 w-full rounded-lg"
                    required
                  />

                  {/* Right: Paste or Clear button */}
                  <div className="absolute right-1.5">
                    {!inputUrl ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handlePaste}
                        className="h-8 px-3 text-xs font-semibold bg-white text-zinc-600 border border-zinc-200 hover:text-zinc-900 hover:bg-zinc-100 shadow-sm rounded-md transition-all flex items-center gap-1.5"
                      >
                        <ClipboardPaste className="h-3 w-3" />
                        Paste
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleClear}
                        className="h-8 px-3 text-xs font-semibold bg-white text-zinc-500 border border-zinc-200 hover:text-red-600 hover:border-red-200 hover:bg-red-50 shadow-sm rounded-md transition-all flex items-center gap-1.5"
                      >
                        <X className="h-3 w-3" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-sm font-semibold text-zinc-800">
                    Response Sheet Page HTML Source
                  </label>
                  {!htmlSource ? (
                    <button
                      type="button"
                      onClick={handlePasteHtml}
                      className="text-xs font-bold text-zinc-600 hover:text-zinc-900 bg-zinc-100 px-2 py-1 rounded border border-zinc-200 flex items-center gap-1"
                    >
                      <ClipboardPaste className="h-3 w-3" /> Paste Code
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleClearHtml}
                      className="text-xs font-bold text-zinc-500 hover:text-red-600 bg-zinc-100 px-2 py-1 rounded border border-zinc-200 flex items-center gap-1"
                    >
                      <X className="h-3 w-3" /> Clear Code
                    </button>
                  )}
                </div>
                
                <textarea
                  placeholder="How to copy HTML source:&#10;1. Open your response sheet URL&#10;2. Right click -> 'View page source' (or Ctrl+U / Cmd+U)&#10;3. Select all (Ctrl+A) and Copy&#10;4. Paste the raw code here"
                  value={htmlSource}
                  onChange={(e) => setHtmlSource(e.target.value)}
                  rows={6}
                  className="brand-focus font-mono text-xs p-3 bg-zinc-50/50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 transition-all w-full rounded-lg resize-none outline-none"
                  required
                />
              </div>
            )}

            {/* 2. Zone */}
            <div>
              <label className="block text-sm font-semibold text-zinc-800 mb-2 ml-1">
                RRB Zone
              </label>
              <Select value={zone} onValueChange={setZone}>
                <SelectTrigger className="brand-focus w-full pl-3 bg-zinc-50/50 border-zinc-200 text-zinc-900 focus:ring-0 focus:ring-offset-0 h-11 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4" style={{ color: zone ? brandColor : "#a1a1aa" }} />
                    <span className="text-sm font-medium">
                      <SelectValue placeholder="Select Zone" />
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="border-zinc-200 max-h-[250px] rounded-lg">
                  {RRB_ZONES.map((z) => (
                    <SelectItem key={z} value={z} className="text-sm cursor-pointer">{z}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Category */}
            <div>
              <label className="block text-sm font-semibold text-zinc-800 mb-2 ml-1">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="brand-focus w-full pl-3 bg-zinc-50/50 border-zinc-200 text-zinc-900 focus:ring-0 focus:ring-offset-0 h-11 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4" style={{ color: category ? brandColor : "#a1a1aa" }} />
                    <span className="text-sm font-medium">
                      <SelectValue placeholder="Select Category" />
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="border-zinc-200 rounded-lg">
                  <SelectItem value="UR"  className="cursor-pointer text-sm">UR (Unreserved)</SelectItem>
                  <SelectItem value="OBC" className="cursor-pointer text-sm">OBC</SelectItem>
                  <SelectItem value="EWS" className="cursor-pointer text-sm">EWS</SelectItem>
                  <SelectItem value="SC"  className="cursor-pointer text-sm">SC</SelectItem>
                  <SelectItem value="ST"  className="cursor-pointer text-sm">ST</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit */}
            <Button
              className="w-full font-medium text-white shadow-sm transition-all h-10"
              style={{ backgroundColor: brandColor }}
              disabled={loading}
              type="submit"
            >
              Check Score
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}