import Link from "next/link";
import { BqMark } from "@/components/brand/BqMark";

const LEGAL = [
  ["/privacy", "Privacy"],
  ["/biometric-policy", "Biometric Policy"],
  ["/terms", "Terms"],
  ["/contact", "Contact"],
] as const;

/** The Swiss Ink footer row: ink band, brand, legal links. */
function SiteFooter() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-8 gap-y-4 px-[clamp(20px,4vw,48px)] pt-6 pb-12 text-sm text-[#8c8a84]">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Builder's Quotient home">
          <BqMark className="h-6 w-6 text-paper" />
          <span className="text-[15px] font-semibold tracking-[-0.025em] text-paper">Builder&apos;s Quotient</span>
        </Link>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="inline-flex min-h-11 items-center hover:text-paper">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <span>&copy; {new Date().getFullYear()} Austin Christian University</span>
      </div>
    </footer>
  );
}

export { SiteFooter };
