import type { Metadata } from "next";
import { UploadQueueProvider } from "@/lib/assessment/upload-queue";
import { UploadStatusBar } from "@/components/assessment/UploadStatusBar";

export const metadata: Metadata = {
  title: "Assessment",
  robots: { index: false, follow: false },
};

export default function AssessmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UploadQueueProvider>
      <main id="main-content">
        <UploadStatusBar />
        {children}
      </main>
    </UploadQueueProvider>
  );
}
