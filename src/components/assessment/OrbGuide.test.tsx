// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { OrbGuide } from "./OrbGuide";
import type { OrbScript } from "@/lib/assessment/orb-scripts";

// Mock window.matchMedia (not implemented in jsdom)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock HTMLMediaElement.play/pause
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(
    () => Promise.resolve()
  );
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  Object.defineProperty(HTMLMediaElement.prototype, "duration", {
    get: () => 10,
    configurable: true,
  });
});

const MOCK_SCRIPT: OrbScript = {
  audioUrl: "/audio/test.mp3",
  captions: [
    { startTime: 0, endTime: 5, text: "First caption" },
    { startTime: 5, endTime: 10, text: "Second caption" },
  ],
};

describe("OrbGuide", () => {
  it("renders the Begin button in idle state", () => {
    render(
      <OrbGuide
        script={MOCK_SCRIPT}
        onContinue={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /begin/i })).toBeInTheDocument();
  });

  it("shows Skip and disabled Continue after clicking Begin", async () => {
    render(
      <OrbGuide
        script={MOCK_SCRIPT}
        onContinue={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /begin/i }));
    });
    expect(screen.getByRole("button", { name: /skip/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("calls onSkip and enables Continue when Skip is clicked", async () => {
    const onSkip = vi.fn();
    render(
      <OrbGuide
        script={MOCK_SCRIPT}
        onContinue={vi.fn()}
        onSkip={onSkip}
      />
    );
    // Start playback first
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /begin/i }));
    });
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(onSkip).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /continue/i })).not.toBeDisabled();
  });

  it("shows all captions as static text when audio fails to load", async () => {
    render(
      <OrbGuide
        script={MOCK_SCRIPT}
        onContinue={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    // Simulate audio error
    const audio = document.querySelector("audio");
    act(() => {
      audio?.dispatchEvent(new Event("error"));
    });
    expect(screen.getByText("First caption")).toBeInTheDocument();
    expect(screen.getByText("Second caption")).toBeInTheDocument();
    // Continue should be enabled on error
    expect(screen.getByRole("button", { name: /continue/i })).not.toBeDisabled();
  });

  it("has aria-live region for captions", () => {
    render(
      <OrbGuide
        script={MOCK_SCRIPT}
        onContinue={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
  });
});
