import { NextRequest, NextResponse } from "next/server";
import { getResultsByToken } from "@/lib/queries/results";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "token param required" }, { status: 400 });
  }

  const data = await getResultsByToken(token);
  if (!data) {
    return NextResponse.json({ error: "No data for token" }, { status: 404 });
  }

  return NextResponse.json(data);
}
