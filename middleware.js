import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

const isProduction = process.env.NODE_ENV === "production";
const USER_PAGE_ROUTES = ["/orders", "/wishlist"];

function matches(pathname, route) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function unauthorized(request, pathname) {
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 },
    );
  }
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

function forbidden(request, pathname) {
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { success: false, message: "Administrator access required" },
      { status: 403 },
    );
  }
  return NextResponse.redirect(new URL("/", request.url));
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = matches(pathname, "/admin") || matches(pathname, "/api/admin");
  const isUserRoute = USER_PAGE_ROUTES.some((route) => matches(pathname, route)) || matches(pathname, "/api/orders");

  if (isAdminRoute || isUserRoute) {
    const user = await getAuthUser(request);
    if (!user) return unauthorized(request, pathname);
    if (isAdminRoute && user.role !== "ADMIN") return forbidden(request, pathname);
  }

  const nonce = crypto.randomUUID().replace(/-/g, "");
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  const response = NextResponse.next({ request: { headers } });
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isProduction ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://www.google-analytics.com https://connect.facebook.net",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  // Enable after all inline scripts have been migrated to use the nonce.
  // response.headers.set("Content-Security-Policy", csp);
  void csp;
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-Frame-Options", "DENY");
  if (isProduction) response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
