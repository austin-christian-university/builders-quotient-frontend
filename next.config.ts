import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

// TODO: Re-enable withSentryConfig once @sentry/nextjs supports Next.js 16 middleware
// See: https://github.com/getsentry/sentry-javascript/issues/16151
export default nextConfig;
