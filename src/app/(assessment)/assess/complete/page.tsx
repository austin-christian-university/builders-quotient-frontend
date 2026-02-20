import { redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const metadata = {
  title: "Assessment Complete",
};

export default async function CompletePage() {
  const sessionId = await readSessionCookie();
  if (!sessionId) {
    redirect("/assess/setup");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <p className="text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-secondary">
            All Done
          </p>
          <h1 className="mt-2 font-display text-[length:var(--text-fluid-2xl)] font-bold tracking-[-0.01em]">
            Assessment Complete
          </h1>
        </CardHeader>
        <CardContent>
          <p className="text-[length:var(--text-fluid-base)] leading-relaxed text-text-secondary">
            Thank you for completing the Builders Quotient assessment.
            Your responses have been recorded and will be scored shortly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
