import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ---------- Content Security Policy ----------
  // Next.js inlines scripts/styles, so we need 'unsafe-inline'.
  // Google Fonts are self-hosted by next/font, so no external font-src needed.
  // .trim() is critical — Vercel env vars can have trailing newlines which
  // make the header value invalid and crash the edge runtime.
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    `connect-src 'self' ${supabaseUrl} https://*.supabase.co https://*.ingest.us.sentry.io https://*.i.posthog.com`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `media-src 'self' blob: ${supabaseUrl}`,
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  // ---------- Additional Security Headers ----------
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(self), geolocation=()",
  );

  // Strict-Transport-Security (only meaningful over HTTPS in production)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  return response;
}

export const config = {
  // Run on all routes except static files and Next.js internals
  matcher: [
    "/((?!_next/static|_next/image|monitoring|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
