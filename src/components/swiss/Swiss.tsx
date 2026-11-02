import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Swiss Ink page primitives, matching the landing: a 1240px wrap with a fluid
 * gutter, flush-left display type, ink rules between sections, a numbered label
 * column, and an ink end band with the one vermilion button.
 */

function Wrap({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto max-w-[1240px] px-[clamp(20px,4vw,48px)]", className)}>{children}</div>;
}

function PageHeader({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lede?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Wrap className="pt-[clamp(48px,8vw,104px)] pb-[clamp(48px,7vw,88px)]">
      {eyebrow && <p className="mb-[clamp(20px,3vw,36px)] text-sm text-[#8c8a84]">{eyebrow}</p>}
      <h1 className="max-w-[18ch] text-[clamp(44px,8vw,120px)] font-semibold leading-[0.9] tracking-[-0.055em]">
        {title}
      </h1>
      {lede && <p className="mt-[clamp(24px,3vw,40px)] max-w-[44ch] text-[clamp(18px,1.6vw,21px)] leading-[1.45]">{lede}</p>}
      {children}
    </Wrap>
  );
}

function Section({
  n,
  label,
  title,
  lede,
  id,
  children,
}: {
  n?: string;
  label: string;
  title?: React.ReactNode;
  lede?: React.ReactNode;
  id?: string;
  children?: React.ReactNode;
}) {
  return (
    <section id={id}>
      <Wrap>
        <div className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(64px,9vw,112px)] md:grid-cols-12 md:gap-x-6">
          <div className="col-span-4 mb-8 flex gap-2.5 pt-1 text-sm text-[#8c8a84] md:col-span-3 md:mb-0">
            {n && <b className="font-semibold text-ink">{n}</b>} {label}
          </div>
          <div className="col-span-4 min-w-0 md:col-span-9">
            {title && (
              <h2 className="max-w-[18ch] text-[clamp(34px,5vw,64px)] font-semibold leading-[0.98] tracking-[-0.045em]">
                {title}
              </h2>
            )}
            {lede && <p className="mt-6 max-w-[56ch] text-[clamp(17px,1.4vw,19px)] leading-[1.5] text-[#3d3c39]">{lede}</p>}
            {children && <div className={title || lede ? "mt-12" : undefined}>{children}</div>}
          </div>
        </div>
      </Wrap>
    </section>
  );
}

function EndCta({
  title,
  body,
  cta = "Begin Assessment",
  href = "/assess/overview",
}: {
  title: React.ReactNode;
  body?: React.ReactNode;
  cta?: string;
  href?: string;
}) {
  return (
    <section className="bg-ink text-paper">
      <Wrap className="grid grid-cols-4 gap-x-4 py-[clamp(72px,10vw,128px)] md:grid-cols-12 md:gap-x-6">
        <h2 className="col-span-4 max-w-[14ch] text-[clamp(34px,5vw,64px)] font-semibold leading-[0.98] tracking-[-0.045em] md:col-span-8">
          {title}
        </h2>
        {body && <p className="col-span-4 mt-7 max-w-[40ch] text-lg text-[#bdbab2] md:col-span-5">{body}</p>}
        <div className="col-span-4 mt-7 self-end md:col-span-4 md:col-start-9 md:row-start-1">
          <Link
            href={href}
            className="inline-flex h-12 items-center gap-2.5 whitespace-nowrap border border-vermilion bg-vermilion px-[22px] text-[15px] font-semibold text-ink hover:border-[#d93d25] hover:bg-[#d93d25]"
          >
            {cta} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </Wrap>
    </section>
  );
}

export { Wrap, PageHeader, Section, EndCta };
