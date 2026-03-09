"use client";

import { useRef, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
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

  const badgeColor =
    vignetteType === "practical"
      ? "bg-primary/20 text-primary"
      : "bg-secondary/20 text-secondary";

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeColor}`}
          >
            {typeLabel}
          </span>
          <span className="text-sm text-text-secondary">
            Vignette {index + 1}
          </span>
          {estimatedSeconds != null && (
            <span className="text-sm text-text-secondary">
              ~{Math.round(estimatedSeconds)}s narration
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Vignette text */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">
            Vignette Text
          </h3>
          <p className="whitespace-pre-wrap text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary">
            {text}
          </p>
        </div>

        {/* Prompts */}
        <div className="space-y-4">
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
              size="sm"
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
      </CardContent>
    </Card>
  );
}

function PromptSection({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <h4 className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">
        {label}
      </h4>
      <p className="whitespace-pre-wrap rounded-xl border border-border-glass bg-bg-base/50 px-4 py-3 text-[length:var(--text-fluid-sm)] leading-relaxed text-text-primary">
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
      <rect x="3" y="2" width="4" height="12" rx="1" />
      <rect x="9" y="2" width="4" height="12" rx="1" />
    </svg>
  );
}
