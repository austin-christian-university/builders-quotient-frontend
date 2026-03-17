import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const alt = "Builder&#x27;s Quotient — Discover your Builder DNA";
export const contentType = "image/png";

function lineProps(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  return { length, angle, cx, cy };
}

export default async function OGImage() {
  const [interTight700, inter600, inter400] = await Promise.all([
    fetch(
      "https://fonts.gstatic.com/s/intertight/v9/NGSnv5HMAFg6IuGlBNMjxJEL2VmU3NS7Z2mj6AiqXA.ttf"
    ).then((res) => res.arrayBuffer()),
    fetch(
      "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf"
    ).then((res) => res.arrayBuffer()),
    fetch(
      "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf"
    ).then((res) => res.arrayBuffer()),
  ]);

  // [x, y, coreR, ringR, ringOpacity, haloR]
  const primaryNodes: [number, number, number, number, number, number][] = [
    [150, 100, 5, 11, 0.4, 20],
    [350, 180, 6, 13, 0.45, 22],
    [500, 120, 4.5, 10, 0.35, 18],
    [700, 200, 5.5, 12, 0.4, 20],
    [850, 150, 5, 11, 0.35, 18],
    [1050, 220, 5.5, 12, 0.4, 20],
    [200, 350, 4.5, 10, 0.35, 18],
    [400, 420, 5.5, 12, 0.4, 20],
    [600, 435, 6, 13, 0.45, 22],
    [800, 450, 5, 11, 0.35, 18],
    [1000, 400, 5.5, 12, 0.4, 20],
  ];

  // [x, y, coreR, ringR, ringOpacity]
  const satelliteNodes: [number, number, number, number, number][] = [
    [80, 250, 3, 8, 0.25],
    [450, 500, 3.5, 9, 0.25],
    [750, 320, 3.5, 9, 0.25],
    [1120, 340, 3, 8, 0.25],
  ];

  // [x, y, r, opacity]
  const ambientDots: [number, number, number, number][] = [
    [250, 530, 2.5, 0.55],
    [550, 60, 2.5, 0.5],
    [900, 550, 2.5, 0.55],
    [1100, 100, 2.5, 0.5],
    [50, 450, 2, 0.45],
    [300, 60, 2, 0.4],
    [650, 550, 2, 0.45],
    [950, 80, 2, 0.4],
    [1150, 500, 2, 0.45],
  ];

  // [x, y, r, opacity]
  const starSpecks: [number, number, number, number][] = [
    [120, 180, 1.2, 0.6],
    [280, 280, 1.2, 0.5],
    [520, 480, 1.2, 0.5],
    [680, 80, 1.2, 0.55],
    [920, 300, 1.2, 0.5],
    [1080, 480, 1.2, 0.55],
    [180, 480, 1, 0.45],
    [430, 80, 1, 0.4],
    [770, 560, 1, 0.45],
    [960, 180, 1, 0.4],
  ];

  // [fromIdx, toIdx, opacity, lineWidth]
  const primaryConnections: [number, number, number, number][] = [
    [0, 1, 0.4, 1],
    [1, 2, 0.35, 1],
    [2, 3, 0.3, 0.9],
    [3, 4, 0.4, 1],
    [4, 5, 0.35, 1],
    [6, 7, 0.35, 1],
    [7, 8, 0.4, 1],
    [8, 9, 0.3, 0.9],
    [9, 10, 0.4, 1],
    [1, 7, 0.2, 0.8],
    [3, 8, 0.2, 0.8],
    [4, 9, 0.18, 0.7],
    [2, 7, 0.14, 0.6],
    [0, 6, 0.18, 0.7],
    [5, 10, 0.18, 0.7],
    [0, 2, 0.1, 0.5],
    [3, 5, 0.1, 0.5],
    [6, 8, 0.1, 0.5],
    [9, 5, 0.08, 0.5],
    [1, 8, 0.08, 0.5],
  ];

  // [satIdx, priIdx, opacity]
  const satelliteConnections: [number, number, number][] = [
    [0, 6, 0.12],
    [1, 1, 0.1],
    [1, 8, 0.1],
    [2, 3, 0.1],
    [2, 9, 0.1],
    [3, 5, 0.12],
    [3, 10, 0.1],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: 1200,
          height: 630,
          backgroundColor: "#0a0a0c",
          position: "relative",
        }}
      >
        {/* Primary connection lines */}
        {primaryConnections.map(([i, j, opacity, lineWidth], idx) => {
          const [x1, y1] = primaryNodes[i];
          const [x2, y2] = primaryNodes[j];
          const { length, angle, cx, cy } = lineProps(x1, y1, x2, y2);
          return (
            <div
              key={`pc-${idx}`}
              style={{
                display: "flex",
                position: "absolute",
                left: cx - length / 2,
                top: cy - lineWidth / 2,
                width: length,
                height: lineWidth,
                backgroundColor: `rgba(77,163,255,${opacity})`,
                transform: `rotate(${angle}deg)`,
                borderRadius: 1,
              }}
            />
          );
        })}

        {/* Satellite connection lines */}
        {satelliteConnections.map(([si, pi, opacity], idx) => {
          const [sx, sy] = satelliteNodes[si];
          const [px, py] = primaryNodes[pi];
          const { length, angle, cx, cy } = lineProps(sx, sy, px, py);
          return (
            <div
              key={`sc-${idx}`}
              style={{
                display: "flex",
                position: "absolute",
                left: cx - length / 2,
                top: cy - 0.5,
                width: length,
                height: 1,
                backgroundColor: `rgba(77,163,255,${opacity})`,
                transform: `rotate(${angle}deg)`,
                borderRadius: 1,
              }}
            />
          );
        })}

        {/* Primary nodes — halos */}
        {primaryNodes.map(([x, y, , , , haloR], idx) => (
          <div
            key={`ph-${idx}`}
            style={{
              display: "flex",
              position: "absolute",
              left: x - haloR,
              top: y - haloR,
              width: haloR * 2,
              height: haloR * 2,
              borderRadius: "50%",
              backgroundColor: "rgba(77,163,255,0.06)",
            }}
          />
        ))}

        {/* Primary nodes — glow rings */}
        {primaryNodes.map(([x, y, , ringR, ringOp], idx) => (
          <div
            key={`pr-${idx}`}
            style={{
              display: "flex",
              position: "absolute",
              left: x - ringR,
              top: y - ringR,
              width: ringR * 2,
              height: ringR * 2,
              borderRadius: "50%",
              border: `1px solid rgba(77,163,255,${ringOp})`,
            }}
          />
        ))}

        {/* Primary nodes — cores */}
        {primaryNodes.map(([x, y, coreR], idx) => (
          <div
            key={`pk-${idx}`}
            style={{
              display: "flex",
              position: "absolute",
              left: x - coreR,
              top: y - coreR,
              width: coreR * 2,
              height: coreR * 2,
              borderRadius: "50%",
              backgroundColor: "#4da3ff",
            }}
          />
        ))}

        {/* Satellite nodes — rings */}
        {satelliteNodes.map(([x, y, , ringR, ringOp], idx) => (
          <div
            key={`sr-${idx}`}
            style={{
              display: "flex",
              position: "absolute",
              left: x - ringR,
              top: y - ringR,
              width: ringR * 2,
              height: ringR * 2,
              borderRadius: "50%",
              border: `1px solid rgba(77,163,255,${ringOp})`,
            }}
          />
        ))}

        {/* Satellite nodes — cores */}
        {satelliteNodes.map(([x, y, coreR], idx) => (
          <div
            key={`sk-${idx}`}
            style={{
              display: "flex",
              position: "absolute",
              left: x - coreR,
              top: y - coreR,
              width: coreR * 2,
              height: coreR * 2,
              borderRadius: "50%",
              backgroundColor: "#4da3ff",
            }}
          />
        ))}

        {/* Ambient dots */}
        {ambientDots.map(([x, y, r, op], idx) => (
          <div
            key={`ad-${idx}`}
            style={{
              display: "flex",
              position: "absolute",
              left: x - r,
              top: y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              backgroundColor: `rgba(77,163,255,${op})`,
            }}
          />
        ))}

        {/* Star specks */}
        {starSpecks.map(([x, y, r, op], idx) => (
          <div
            key={`ss-${idx}`}
            style={{
              display: "flex",
              position: "absolute",
              left: x - r,
              top: y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              backgroundColor: `rgba(77,163,255,${op})`,
            }}
          />
        ))}

        {/* Eyebrow — pinned to top, above all stars */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 28,
            left: 0,
            width: 1200,
            justifyContent: "center",
            fontFamily: "Inter",
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "0.3em",
            color: "rgba(233,185,73,0.9)",
          }}
        >
          AUSTIN CHRISTIAN UNIVERSITY
        </div>

        {/* Title — centered */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 0,
            top: 0,
            width: 1200,
            height: 630,
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Inter Tight",
            fontSize: 110,
            fontWeight: 700,
            color: "#f5f6fa",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          Builder&#x27;s Quotient
        </div>

        {/* Golden divider — 90% width, fades from transparent to gold to transparent */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 375,
            left: 60,
            width: 1080,
            height: 3,
            backgroundImage:
              "linear-gradient(90deg, transparent, rgba(233,185,73,1) 30%, rgba(233,185,73,1) 70%, transparent)",
            borderRadius: 2,
          }}
        />

        {/* Tagline — pinned below constellations */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 32,
            left: 0,
            width: 1200,
            justifyContent: "center",
            fontFamily: "Inter",
            fontSize: 36,
            fontWeight: 400,
            color: "#9aa0ac",
            lineHeight: 1.5,
          }}
        >
          Discover your Builder DNA
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Inter Tight",
          data: interTight700,
          weight: 700 as const,
          style: "normal" as const,
        },
        {
          name: "Inter",
          data: inter600,
          weight: 600 as const,
          style: "normal" as const,
        },
        {
          name: "Inter",
          data: inter400,
          weight: 400 as const,
          style: "normal" as const,
        },
      ],
    }
  );
}
