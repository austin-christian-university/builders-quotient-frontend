export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  // Edge runtime Sentry disabled — causes MIDDLEWARE_INVOCATION_FAILED on Vercel
  // with @sentry/nextjs 10.x + Next.js 16. Server-side Sentry still captures errors.
}

export async function onRequestError(
  ...args: Parameters<typeof import("@sentry/nextjs").captureRequestError>
) {
  const Sentry = await import("@sentry/nextjs");
  return Sentry.captureRequestError(...args);
}
