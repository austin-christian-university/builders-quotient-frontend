import { NextRequest, NextResponse } from "next/server";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import { verifyVignetteToken } from "@/lib/assessment/vignette-token";
import { getSessionById } from "@/lib/queries/session";
import { createSignedUploadUrl } from "@/lib/supabase/storage";

export async function POST(request: NextRequest) {
  console.log("[BQ Upload API] POST /api/upload — request received");

  let body: {
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
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // The session cookie is the primary credential. The vignette write token is
  // the fallback that keeps an already-recorded response uploadable when the
  // cookie is lost mid-vignette (see lib/assessment/vignette-token.ts).
  const cookieSessionId = await readSessionCookie();
  const tokenClaims = cookieSessionId
    ? null
    : await verifyVignetteToken(body.writeToken);
  const sessionId = cookieSessionId ?? tokenClaims?.sessionId ?? null;

  if (!sessionId) {
    console.warn("[BQ Upload API] No session cookie and no valid write token");
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const session = await getSessionById(sessionId);
  if (!session) {
    console.warn(`[BQ Upload API] Session not found for id: ${sessionId.slice(0, 8)}...`);
    return NextResponse.json({ error: "Session not found" }, { status: 401 });
  }

  let storagePath: string;

  if (body.warmupIndex !== undefined) {
    // Warmup upload path
    const { warmupIndex } = body;
    if (typeof warmupIndex !== "number" || ![1, 2, 3].includes(warmupIndex)) {
      console.error(`[BQ Upload API] Invalid warmupIndex: ${warmupIndex}`);
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }
    storagePath = `${sessionId}/warmup_${warmupIndex}.webm`;
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
    storagePath = `${sessionId}/${vignetteType}_${step}_phase${responsePhase}.webm`;
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
