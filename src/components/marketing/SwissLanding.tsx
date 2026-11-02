import Link from "next/link";
import { BqMark } from "@/components/brand/BqMark";
import s from "./SwissLanding.module.css";

const ASSESS_HREF = "/assess/overview";

const STEPS = [
  ["Watch", "Observe real entrepreneurs navigating critical business moments through AI-narrated vignettes."],
  ["Think", "Analyze the situation and decide what you would do in the entrepreneur's position."],
  ["Respond", "Share your reasoning on camera. The AI captures not just what you say, but how you think."],
  ["Discover", "Receive a detailed profile of your entrepreneurial thinking across intelligence and personality domains."],
] as const;

const RESULTS = [
  "Your entrepreneurial archetype",
  "How you reason through real business problems",
  "Your creative problem-solving style",
  "Your communication style",
  "Which real entrepreneurs think most like you",
  "Shareable profile cards",
];

const ARCHETYPES = ["The Theorist", "Pathfinder", "Cartographer", "Steward", "Catalyst"];

const FAQS = [
  ["How long does it take?", "About 20 minutes — the vignettes, your recorded responses, and a short personality quiz."],
  ["Can I retake it?", "As many times as you like. Every attempt gets its own permanent results link. There's a two-hour wait between attempts."],
  ["Do I need to prepare?", "No."],
  ["How is it scored?", "By AI trained on data from 274 real entrepreneurs. The personality quiz is scored against entrepreneurial trait benchmarks."],
  ["What happens to my video?", "It's processed securely, used solely for your profile, and never shared with third parties."],
  ["What devices work?", "A laptop or desktop, in Chrome, Firefox or Safari."],
] as const;

const LEGAL = [
  ["/privacy", "Privacy"],
  ["/biometric-policy", "Biometric Policy"],
  ["/terms", "Terms"],
  ["/contact", "Contact"],
] as const;

function Section({
  n,
  label,
  id,
  children,
}: {
  n: string;
  label: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={s.wrap} id={id}>
      <div className={`${s.grid} ${s.s}`}>
        <div className={s.lab}>
          <b>{n}</b> {label}
        </div>
        <div className={s.main}>{children}</div>
      </div>
    </section>
  );
}

function BeginButton() {
  return (
    <Link className={`${s.btn} ${s.primary}`} href={ASSESS_HREF}>
      Begin Assessment <span aria-hidden="true">→</span>
    </Link>
  );
}

function SwissLanding() {
  return (
    <div className={s.root}>
      <header className={s.nav}>
        <div className={`${s.wrap} ${s.navInner}`}>
          <Link className={s.brand} href="/" aria-label="Builder's Quotient home">
            <BqMark />
            <span>Builder&apos;s Quotient</span>
          </Link>
          <nav className={s.links} aria-label="Primary">
            <a className={s.navLink} href="#how">How it works</a>
            <a className={s.navLink} href="#results">Results</a>
            <a className={s.navLink} href="#faq">FAQ</a>
            <Link className={s.navExplore} href="/entrepreneurs">
              Entrepreneurs
            </Link>
            <Link className={`${s.btn} ${s.small}`} href={ASSESS_HREF}>
              Begin
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section className={s.wrap}>
          <div className={`${s.grid} ${s.hero}`}>
            <p className={s.presented}>Presented by Austin Christian University</p>
            <h1>
              Builder&apos;s
              <br />
              Quotient
            </h1>
            <div className={s.heroMark}>
              <BqMark />
            </div>
            <p className={s.sub}>
              A psychometric assessment that maps your practical intelligence, creative
              reasoning, and entrepreneurial topology.
            </p>
            <div className={s.cta}>
              <BeginButton />
            </div>
          </div>
        </section>

        <Section n="01" label="About">
          <h2>A new kind of exam.</h2>
          <p className={s.lede}>
            The Builders Quotient is a psychometric assessment created by Austin Christian
            University. Think of it like a personality test — but instead of answering
            multiple choice questions, you watch real business scenarios and explain what
            you&apos;d do on camera.
          </p>
          <p className={s.note}>
            Our AI compares your reasoning to how hundreds of the world&apos;s most
            successful entrepreneurs actually responded to similar situations. It measures
            how you solve problems, think creatively, and communicate.
          </p>
        </Section>

        <Section n="02" label="The data">
          <div className={s.stats}>
            {[
              ["274", "entrepreneurs studied"],
              ["350,000+", "videos evaluated"],
              ["5,000+", "real decisions extracted"],
            ].map(([num, what]) => (
              <div className={s.st} key={num}>
                <div className={s.num}>{num}</div>
                <div className={s.what}>{what}</div>
              </div>
            ))}
          </div>
          <p className={`${s.note} ${s.statNote}`}>
            We analyzed hundreds of thousands of videos to find the highest-quality
            entrepreneurial decision-making moments — and distilled them into a rigorous
            scoring framework.
          </p>
        </Section>

        <Section n="03" label="How it works" id="how">
          <h2>Watch. Think. Respond. Discover.</h2>
          <div className={s.steps}>
            {STEPS.map(([title, body], i) => (
              <div className={s.step} key={title}>
                <div className={s.n}>{i + 1}</div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section n="04" label="What you discover">
          <h2>Two intelligences, measured from how you reason.</h2>
          <div className={s.two}>
            <div className={s.dom}>
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <path fill="#111" d="M0 0H64V16H0Z M0 24H40V40H0Z M0 48H24V64H0Z" />
              </svg>
              <h3>Practical intelligence</h3>
              <p>
                How you navigate real business situations—diagnosing problems, choosing
                strategies, and taking action.
              </p>
            </div>
            <div className={s.dom}>
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <path
                  fill="#111"
                  d="M0 0H16V16H0Z M24 0H40V16H24Z M48 0H64V16H48Z M0 24H16V40H0Z M48 24H64V40H48Z M0 48H16V64H0Z M24 48H40V64H24Z M48 48H64V64H48Z"
                />
                <path fill="#111" d="M24 24H40V40H24Z" transform="rotate(45 32 32)" />
              </svg>
              <h3>Creative intelligence</h3>
              <p>
                How you generate novel solutions—observing patterns, reframing problems, and
                communicating ideas.
              </p>
            </div>
          </div>
        </Section>

        <Section n="05" label="Your results" id="results">
          <h2>Your entrepreneurial DNA, decoded.</h2>
          <div className={s.res}>
            <div>
              <ol className={s.resList}>
                {RESULTS.map((item, i) => (
                  <li key={item}>
                    <span>{String.fromCharCode(97 + i)}</span>
                    {item}
                  </li>
                ))}
              </ol>
              <Link className={s.example} href="/results/test-jordan-maker">
                See an example profile →
              </Link>
            </div>
            <div className={s.arch}>
              <small>Archetypes include</small>
              <ul>
                {ARCHETYPES.map((a) => (
                  <li key={a} className={a === "Cartographer" ? s.on : undefined}>
                    {a}
                  </li>
                ))}
              </ul>
              <p className={s.more}>One of sixteen.</p>
            </div>
          </div>
        </Section>

        <Section n="06" label="Before you start">
          <h2>Three things to have ready.</h2>
          <div className={s.before}>
            <div className={s.b}>
              <svg viewBox="0 0 40 40" aria-hidden="true">
                <rect x="0" y="8" width="28" height="24" fill="#111" />
                <path d="M28 16L40 10V30L28 24Z" fill="#111" />
              </svg>
              <h3>Camera &amp; Microphone</h3>
              <p>You&apos;ll record short video responses.</p>
            </div>
            <div className={s.b}>
              <svg viewBox="0 0 40 40" aria-hidden="true">
                <path fill="#111" fillRule="evenodd" d="M0 0H40V40H0Z M8 8V32H32V8Z" />
                <path fill="#111" d="M18 12H22V22H18Z M18 18H28V22H18Z" />
              </svg>
              <h3>~20 Minutes</h3>
              <p>Set aside uninterrupted time; you can&apos;t pause and resume.</p>
            </div>
            <div className={s.b}>
              <svg viewBox="0 0 40 40" aria-hidden="true">
                <rect x="0" y="18" width="40" height="4" fill="#111" />
              </svg>
              <h3>Quiet Space</h3>
              <p>Background noise can affect recording quality.</p>
            </div>
          </div>
        </Section>

        <Section n="07" label="FAQ" id="faq">
          <h2>Questions.</h2>
          <div className={s.faq}>
            {FAQS.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <i className={s.plus} aria-hidden="true" />
                </summary>
                <div className={s.answer}>{a}</div>
              </details>
            ))}
          </div>
        </Section>
      </main>

      <footer className={s.end}>
        <div className={s.wrap}>
          <div className={`${s.grid} ${s.endGrid}`}>
            <h2>Ready to find out how you think?</h2>
            <p className={s.endCopy}>
              Take the Builders Quotient assessment and discover your entrepreneurial
              intelligence profile.
            </p>
            <div className={s.go}>
              <BeginButton />
            </div>
          </div>
          <div className={s.foot}>
            <Link className={s.brand} href="/" aria-label="Builder's Quotient home">
              <BqMark className="text-[#F4F1EA]" />
              <span>Builder&apos;s Quotient</span>
            </Link>
            <nav aria-label="Footer">
              <ul className={s.legal}>
                {LEGAL.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href}>{label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
            <span>
              &copy; {new Date().getFullYear()} Austin Christian University
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export { SwissLanding };
