// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://acb0b5cf350df115831297607967468f@o4511021011173376.ingest.us.sentry.io/4511021012025344",

  tracesSampleRate: 1.0,

  // Capture session replay only when an error occurs (free tier friendly)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      // Privacy: mask all text/inputs and block media (webcam recordings, etc.)
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
});
