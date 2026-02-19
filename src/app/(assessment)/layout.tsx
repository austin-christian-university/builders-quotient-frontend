import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assessment",
  robots: { index: false, follow: false },
};

export default function AssessmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main id="main-content">{children}</main>;
}
