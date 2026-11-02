import Link from "next/link";
import { BqMark } from "@/components/brand/BqMark";

const LINKS = [
  ["/#how", "How it works"],
  ["/#results", "Results"],
  ["/#faq", "FAQ"],
] as const;

/** The Swiss Ink top bar, shared by every page outside the landing (which carries its own). */
function SiteNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-ink bg-paper/95">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-[clamp(20px,4vw,48px)]">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="Builder's Quotient home">
          <BqMark className="h-6 w-6" />
          <span className="whitespace-nowrap text-[17px] font-semibold tracking-[-0.025em] max-[359px]:hidden">
            Builder&apos;s Quotient
          </span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-4 text-[15px] min-[421px]:gap-7">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="hover:underline hover:underline-offset-4 max-[820px]:hidden">
              {label}
            </Link>
          ))}
          <Link href="/entrepreneurs" className="hover:underline hover:underline-offset-4">
            The data
          </Link>
          <Link
            href="/assess/overview"
            className="inline-flex h-[38px] items-center bg-ink px-3.5 text-sm font-semibold text-paper hover:bg-[#2a2a2a]"
          >
            Begin
          </Link>
        </nav>
      </div>
    </header>
  );
}

export { SiteNav };
