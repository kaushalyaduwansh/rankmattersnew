import { NextResponse } from "next/server";

/**
 * GET /api/proxy-html?url=<encoded-rrb-url>
 *
 * A thin server-side proxy that fetches raw HTML from RRB's servers
 * (which block browser/CORS requests) and returns it to the client.
 * ALL parsing and score calculation still happens on the user's device.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl || !targetUrl.startsWith("http")) {
    return NextResponse.json(
      { error: "Missing or invalid url parameter" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        // Mimic a real browser to avoid bot-detection blocks
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      // No caching — always fetch fresh HTML
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Remote server returned HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Return the raw HTML with CORS headers so the browser can read it
    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    console.error("Proxy fetch error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch remote URL" },
      { status: 500 }
    );
  }
}
