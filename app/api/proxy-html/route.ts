import { NextResponse } from "next/server";

/**
 * GET /api/proxy-html?url=<encoded-rrb-url>
 *
 * Server-side proxy for RRB answer-key HTML.
 * RRB's server blocks direct browser requests (CORS) and also rejects
 * server requests that don't look like a real browser session.
 * This route sends a full browser-like header set so RRB accepts it.
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

  // Derive the origin from the target URL so Referer & Origin look authentic
  let targetOrigin = "";
  try {
    targetOrigin = new URL(targetUrl).origin;
  } catch {
    targetOrigin = "https://rrb.digialm.com";
  }

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      // Full browser-grade headers — RRB 400s when these are missing
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        // Referer & Origin make it look like the user opened the link in a browser tab
        Referer: targetOrigin + "/",
        Origin: targetOrigin,
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Connection: "keep-alive",
      },
      redirect: "follow",   // follow any redirects RRB does
      cache: "no-store",
    });

    // If RRB still rejects, surface the real status code + body for debugging
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(
        `[proxy-html] RRB returned ${response.status}. URL: ${targetUrl}. Body snippet: ${body.slice(0, 300)}`
      );
      return NextResponse.json(
        {
          error: `Could not fetch answer key (HTTP ${response.status}). The URL may have expired — please copy a fresh link from the RRB portal.`,
        },
        { status: 502 }   // 502 = our server got a bad response from upstream
      );
    }

    const html = await response.text();

    if (!html || html.trim().length < 100) {
      return NextResponse.json(
        { error: "The response sheet page is empty. Please check your URL." },
        { status: 502 }
      );
    }

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[proxy-html] Fetch error:", err.message);
    return NextResponse.json(
      {
        error:
          err.message?.includes("ENOTFOUND") || err.message?.includes("fetch")
            ? "Could not reach the RRB server. Please check your internet connection."
            : err.message || "Failed to fetch remote URL",
      },
      { status: 500 }
    );
  }
}
