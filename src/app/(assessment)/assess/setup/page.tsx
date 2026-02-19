import { redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import { getActiveSession } from "@/lib/queries/session";
import { SetupClient } from "./setup-client";

export const metadata = {
  title: "Setup",
};

export default async function SetupPage() {
  // If the user already has a valid session, resume it
  const sessionId = await readSessionCookie();
  if (sessionId) {
    const session = await getActiveSession(sessionId);
    if (session) {
      redirect("/assess/1");
    }
  }

  return <SetupClient />;
}
