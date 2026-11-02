import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Wrap } from "@/components/swiss/Swiss";

export const metadata: Metadata = {
  title: "Contact",
};

const ROW =
  "grid grid-cols-4 gap-x-4 border-t border-ink pt-6 pb-[clamp(32px,5vw,56px)] md:grid-cols-12 md:gap-x-6";
const LABEL =
  "col-span-4 mb-4 flex gap-2.5 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink md:col-span-4 md:mb-0 md:pr-8";
const BODY =
  "col-span-4 min-w-0 max-w-[62ch] text-[17px] leading-[1.6] text-[#3d3c39] md:col-span-8";

export default function ContactPage() {
  return (
    <main id="main-content">
      <PageHeader
        eyebrow="Get in Touch"
        title="Contact"
        lede={<>We&rsquo;d love to hear from you.</>}
      />

      <Wrap>
        <div className="pb-[clamp(64px,9vw,112px)]">
          <section className={ROW}>
            <div className="hidden md:col-span-4 md:block" aria-hidden="true" />
            <div className={BODY}>
              <p>
                Have questions about the Builders Quotient assessment, your results,
                or the admissions process? Reach out and we&rsquo;ll get back to you
                as soon as we can.
              </p>
            </div>
          </section>
          <section className={ROW}>
            <h2 className={LABEL}>
              <span className="tabular-nums">01</span>
              <span>Email</span>
            </h2>
            <div className={BODY}>
              <p>
                Email us at{" "}
                <a
                  href="mailto:enrollment@austinchristianu.org"
                  className="break-all text-ink underline decoration-1 underline-offset-4 hover:decoration-2"
                >
                  enrollment@austinchristianu.org
                </a>
              </p>
            </div>
          </section>
          <section className={ROW}>
            <h2 className={LABEL}>
              <span className="tabular-nums">02</span>
              <span>Address</span>
            </h2>
            <div className={BODY}>
              <p>
                Austin Christian University
                <br />
                Austin, TX
              </p>
            </div>
          </section>
          <div className="border-t border-ink pt-6">
            <Link
              href="/"
              className="text-[15px] text-ink underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              &larr; Back to home
            </Link>
          </div>
        </div>
      </Wrap>
    </main>
  );
}
