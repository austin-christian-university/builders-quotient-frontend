import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const alt = "Builder's Quotient — a psychometric assessment by Austin Christian University";
export const contentType = "image/png";

const PAPER = "#F4F1EA";
const INK = "#111111";
const VERMILION = "#E8452C";
const GREY = "#8C8A84";

export default async function OGImage() {
  const interTight700 = await fetch(
    "https://fonts.gstatic.com/s/intertight/v9/NGSnv5HMAFg6IuGlBNMjxJEL2VmU3NS7Z2mj6AiqXA.ttf"
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          color: INK,
          padding: "64px 72px",
          fontFamily: "Inter Tight",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: GREY }}>
          <span>Presented by Austin Christian University</span>
          <span>~20 min · Camera required</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 168,
              fontWeight: 700,
              letterSpacing: "-0.055em",
              lineHeight: 0.86,
            }}
          >
            <span>Builder&apos;s</span>
            <span>Quotient</span>
          </div>
          <svg width="220" height="220" viewBox="0 0 64 64">
            <path fill={INK} fillRule="evenodd" d="M0 0H64V48H48V64H0Z M16 16V48H48V16Z" />
            <path fill={VERMILION} d="M31 41L41 31L64 54V64H54Z" />
          </svg>
        </div>
        <div
          style={{
            display: "flex",
            borderTop: `2px solid ${INK}`,
            paddingTop: 20,
            fontSize: 28,
          }}
        >
          A psychometric assessment of practical intelligence, creative reasoning, and
          entrepreneurial topology.
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Inter Tight", data: interTight700, weight: 700, style: "normal" }],
    }
  );
}
