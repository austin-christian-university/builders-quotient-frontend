import { NextRequest, NextResponse } from "next/server";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import { getActiveSession } from "@/lib/queries/session";
import { createSignedUploadUrl } from "@/lib/supabase/storage";

export async function POST(request: NextRequest) {
  console.log("[BQ Upload API] POST /api/upload — request received");

  const sessionId = await readSessionCookie();
  if (!sessionId) {
    console.warn("[BQ Upload API] No session cookie");
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const session = await getActiveSession(sessionId);
  if (!session) {
    console.warn(`[BQ Upload API] No active session for id: ${sessionId.slice(0, 8)}...`);
    return NextResponse.json({ error: "No active session" }, { status: 401 });
  }

  let body: { vignetteType: string; step: number; responsePhase?: number };
  try {
    body = await request.json();
  } catch {
    console.error("[BQ Upload API] Invalid JSON body");
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { vignetteType, step, responsePhase = 1 } = body;
  if (
    !vignetteType ||
    !["practical", "creative"].includes(vignetteType) ||
    typeof step !== "number" ||
    step < 1 ||
    step > 4 ||
    ![1, 2].includes(responsePhase)
  ) {
    console.error(`[BQ Upload API] Invalid params — vignetteType: ${vignetteType}, step: ${step}, responsePhase: ${responsePhase}`);
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const storagePath = `${sessionId}/${vignetteType}_${step}_phase${responsePhase}.webm`;
  console.log(`[BQ Upload API] Creating signed URL for: ${storagePath}`);

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
