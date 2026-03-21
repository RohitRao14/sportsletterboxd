import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/session";
import { sessionOptions } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(request, res, sessionOptions);

  // API routes — return 401 JSON if not logged in
  if (pathname.startsWith("/api/")) {
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return res;
  }

  // Page routes — redirect to login
  if (!session.isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: [
    "/",
    "/diary/:path*",
    "/log/:path*",
    "/stats/:path*",
    "/api/diary/:path*",
    "/api/events/:path*",
    "/api/search",
    "/api/entities",
    "/api/competitions",
    "/api/stats",
  ],
};
