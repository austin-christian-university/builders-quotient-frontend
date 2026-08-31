import { NextRequest, NextResponse } from "next/server";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import { verifyVignetteToken } from "@/lib/assessment/vignette-token";
import { getSessionById, UNSCORED_STATUSES } from "@/lib/queries/session";
import { vignetteIdForStep } from "@/lib/queries/vignettes";
import { createSignedUploadUrl } from "@/lib/supabase/storage";
import {
  responseStoragePath,
  warmupStoragePath,
} from "@/lib/assessment/storage-paths";

/** Generous ceiling for a small JSON body; stops an unauthenticated caller
 * making us buffer and parse something large before we know who they are. */
const MAX_BODY_BYTES = 4096;

export async function POST(request: NextRequest) {
  console.log("[BQ Upload API] POST /api/upload — request received");

  // The session cookie is the primary credential and is free to read, so check
  // it before touching the body — an authenticated request behaves exactly as
  // it did before write tokens existed.
  const cookieSessionId = await readSessionCookie();

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (!cookieSessionId && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: {
    sessionId?: string;
    vignetteType?: string;
    step?: number;
    responsePhase?: number;
    warmupIndex?: number;
    writeToken?: string;
  };
  try {
    body = await request.json();
  } catch {
    console.error("[BQ Upload API] Invalid JSON body");
    if (!cookieSessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Pick the credential that matches the session the caller is uploading FOR,
  // not just whichever one exists. A student with a second tab can hold a cookie
  // for session B while a queued job belongs to session A; preferring the cookie
  // blindly would sign an object under B while confirmUpload records it under A,
  // leaving the recording orphaned in storage.
  const wantsSession = body.sessionId;
  const cookieMatches =
    cookieSessionId !== null &&
    (wantsSession === undefined || cookieSessionId === wantsSession);

  const tokenClaims = cookieMatches
    ? null
    : await verifyVignetteToken(body.writeToken);

  const sessionId = cookieMatches
    ? cookieSessionId
    : (tokenClaims?.sessionId ?? null);

  if (!sessionId) {
    console.warn("[BQ Upload API] No usable credential for the requested session");
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (wantsSession !== undefined && sessionId !== wantsSession) {
    console.warn("[BQ Upload API] Credential does not match the requested session");
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const session = await getSessionById(sessionId);
  if (!session) {
    console.warn(`[BQ Upload API] Session not found for id: ${sessionId.slice(0, 8)}...`);
    return NextResponse.json({ error: "Session not found" }, { status: 401 });
  }

  // Existence is not enough. Signed URLs are minted with `upsert: true`, so a
  // stale credential for a finished session could otherwise overwrite a
  // recording that has already been graded.
  if (!UNSCORED_STATUSES.includes(session.status as string)) {
    console.warn(
      `[BQ Upload API] Session ${sessionId.slice(0, 8)} is ${session.status}; refusing upload`
    );
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  let storagePath: string;

  if (body.warmupIndex !== undefined) {
    // Warmup upload path. A write token names one vignette and warmups are not
    // vignette-scoped, so the token must never authorize this branch.
    if (tokenClaims) {
      console.warn("[BQ Upload API] Write token cannot authorize a warmup upload");
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { warmupIndex } = body;
    if (typeof warmupIndex !== "number" || ![1, 2, 3].includes(warmupIndex)) {
      console.error(`[BQ Upload API] Invalid warmupIndex: ${warmupIndex}`);
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }
    storagePath = warmupStoragePath(sessionId, warmupIndex);
    console.log(`[BQ Upload API] Creating signed URL for warmup: ${storagePath}`);
  } else {
    // Vignette upload path (existing)
    const { vignetteType, step, responsePhase = 1 } = body;
    if (
      !vignetteType ||
      !["practical", "creative"].includes(vignetteType) ||
      typeof step !== "number" ||
      step < 1 ||
      step > 4 ||
      ![1, 2, 3].includes(responsePhase)
    ) {
      console.error(`[BQ Upload API] Invalid params — vignetteType: ${vignetteType}, step: ${step}, responsePhase: ${responsePhase}`);
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // A write token authorizes ONE vignette. Signed URLs are minted with
    // `upsert: true`, so without this check a token for step 1 could overwrite
    // an already-submitted recording from any other step of the session.
    if (tokenClaims) {
      const expectedVignetteId = vignetteIdForStep(session, step);
      if (!expectedVignetteId || expectedVignetteId !== tokenClaims.vignetteId) {
        console.warn(
          `[BQ Upload API] Write token vignette does not match step ${step}`
        );
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }
    }

    storagePath = responseStoragePath({
      sessionId,
      vignetteType: vignetteType as "practical" | "creative",
      step,
      responsePhase,
    });
    console.log(`[BQ Upload API] Creating signed URL for: ${storagePath}`);
  }

  try {
    const { signedUrl, token } = await createSignedUploadUrl(storagePath);
    console.log(`[BQ Upload API] Signed URL created — token present: ${!!token}`);
    return NextResponse.json({ uploadUrl: signedUrl, storagePath, token });
  } catch (err) {
    console.error("[BQ Upload API] createSignedUploadUrl failed:", err);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
}
