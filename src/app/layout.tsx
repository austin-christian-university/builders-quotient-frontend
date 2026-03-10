import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { GlobalDevToolbar } from "@/components/dev/GlobalDevToolbar";
import { SITE_URL } from "@/lib/constants";

const inter = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight-sans",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Builders Quotient | Austin Christian University",
    template: "%s | Builders Quotient",
  },
  description:
    "Measure your entrepreneurial intelligence. A psychometric assessment of practical thinking, creative reasoning, and entrepreneur personality.",
  openGraph: {
    title: "Builders Quotient | Austin Christian University",
    description:
      "Measure your entrepreneurial intelligence through AI-narrated vignettes and personality profiling.",
    siteName: "Builders Quotient",
    type: "website",
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 800,
        alt: "Austin Christian University",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Builders Quotient | Austin Christian University",
    description:
      "Measure your entrepreneurial intelligence through AI-narrated vignettes and personality profiling.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${interTight.variable} font-sans antialiased`}
      >
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        {children}
        {process.env.NODE_ENV === "development" && <GlobalDevToolbar />}
      </body>
    </html>
  );
}
