import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protect dashboard routes
const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

 
  if (pathname.startsWith("/blog")) {
    const url = req.nextUrl.clone();

    url.hostname = "blog.rankmatters.in";
    url.pathname = pathname.replace("/blog", "") || "/";

    return NextResponse.rewrite(url);
  }

  
  if (isDashboardRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Run on all pages except static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",

    // Always run for API
    "/(api|trpc)(.*)",

    // Run for blog
    "/blog/:path*",
  ],
};
