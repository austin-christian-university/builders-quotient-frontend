import { redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import { ThankYouContent } from "./thank-you-content";

export const metadata = {
  title: "Your Results Are Ready \u2014 Builders Quotient",
};

type Props = {
  searchParams: Promise<{ path?: string }>;
};

export default async function ThankYouPage({ searchParams }: Props) {
  const sessionId = await readSessionCookie();
  if (!sessionId) {
    redirect("/");
  }

  const { path } = await searchParams;
  const variant =
    path === "student"
      ? "student"
      : path === "general"
        ? "general"
        : "default";

  return <ThankYouContent variant={variant} />;
}
