"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  index: number;
  vignetteType: "practical" | "creative";
  typeLabel: string;
  text: string;
  prompts: {
    phase1: string;
    phase2: string | null;
    phase3: string | null;
  };
  audioUrl: string | null;
  estimatedSeconds: number | null;
};

export function VignetteReviewCard({
  index,
  vignetteType,
  typeLabel,
  text,
  prompts,
  audioUrl,
  estimatedSeconds,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function toggleAudio() {
    const el = audioRef.current;
    if (!el) return;

    if (isPlaying) {
      el.pause();
    } else {
      el.play();
    }
  }

  const marker =
    vignetteType === "practical"
      ? "bg-ink"
      : "border border-ink bg-transparent";

  return (
    <article className="grid grid-cols-4 gap-x-4 border-t border-ink pt-6 md:grid-cols-12 md:gap-x-6">
      <header className="col-span-4 mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-[#8c8a84] md:col-span-3 md:mb-0 md:flex-col md:gap-y-2">
        <span className="font-semibold tabular-nums text-ink">
          Vignette {index + 1}
        </span>
        <span className="inline-flex items-center gap-2 text-ink">
          <span aria-hidden="true" className={`inline-block h-2.5 w-2.5 ${marker}`} />
          {typeLabel}
        </span>
        {estimatedSeconds != null && (
          <span className="tabular-nums">
            ~{Math.round(estimatedSeconds)}s narration
          </span>
        )}
      </header>

      <div className="col-span-4 min-w-0 space-y-8 md:col-span-9">
        {/* Vignette text */}
        <div>
          <h3 className="mb-3 text-sm text-[#8c8a84]">Vignette Text</h3>
          <p className="max-w-[68ch] whitespace-pre-wrap text-[length:var(--text-fluid-base)] leading-relaxed text-ink">
            {text}
          </p>
        </div>

        {/* Prompts */}
        <div className="space-y-6">
          <PromptSection label="Phase 1 Prompt" content={prompts.phase1} />
          {prompts.phase2 && (
            <PromptSection label="Phase 2 Prompt" content={prompts.phase2} />
          )}
          {prompts.phase3 && (
            <PromptSection label="Phase 3 Prompt" content={prompts.phase3} />
          )}
        </div>

        {/* Audio player */}
        {audioUrl && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={toggleAudio}
              aria-label={isPlaying ? "Pause narration" : "Play narration"}
            >
              {isPlaying ? (
                <PauseIcon />
              ) : (
                <PlayIcon />
              )}
              {isPlaying ? "Pause" : "Play Narration"}
            </Button>
            <audio
              ref={audioRef}
              src={audioUrl}
              preload="none"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          </div>
        )}
      </div>
    </article>
  );
}

function PromptSection({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <h4 className="mb-2 text-sm text-[#8c8a84]">{label}</h4>
      <p className="max-w-[68ch] whitespace-pre-wrap border-l border-ink pl-4 text-[length:var(--text-fluid-sm)] leading-relaxed text-[#3d3c39]">
        {content}
      </p>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M4 2.5v11l9-5.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="3" y="2" width="4" height="12" />
      <rect x="9" y="2" width="4" height="12" />
    </svg>
  );
}
