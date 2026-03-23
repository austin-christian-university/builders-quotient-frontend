// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { CountdownRing } from "../CountdownRing";

// jsdom doesn't implement window.matchMedia — provide a minimal stub
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});

describe("CountdownRing", () => {
  describe("think mode", () => {
    it("renders countdown seconds and Think label", () => {
      render(<CountdownRing secondsRemaining={15} totalSeconds={30} mode="think" />);
      expect(screen.getByText("15")).toBeInTheDocument();
      expect(screen.getByText("Think\u2026")).toBeInTheDocument();
    });

    it("does not render I'm Done button", () => {
      render(<CountdownRing secondsRemaining={15} totalSeconds={30} mode="think" onStopEarly={() => {}} />);
      expect(screen.queryByText(/done/i)).not.toBeInTheDocument();
    });
  });

  describe("recording mode", () => {
    it("renders MM:SS time and RECORDING label", () => {
      render(<CountdownRing secondsRemaining={65} totalSeconds={75} mode="recording" />);
      expect(screen.getByText("1:05")).toBeInTheDocument();
      expect(screen.getByText("RECORDING")).toBeInTheDocument();
    });

    it("shows I'm Done button after 10s elapsed", () => {
      render(<CountdownRing secondsRemaining={20} totalSeconds={30} mode="recording" onStopEarly={() => {}} />);
      expect(screen.getByText(/done/i)).toBeInTheDocument();
    });

    it("hides I'm Done button before 10s elapsed", () => {
      render(<CountdownRing secondsRemaining={25} totalSeconds={30} mode="recording" onStopEarly={() => {}} />);
      expect(screen.queryByText(/done/i)).not.toBeInTheDocument();
    });

    it("renders custom label when provided", () => {
      render(<CountdownRing secondsRemaining={30} totalSeconds={45} mode="recording" label="Phase 2" />);
      expect(screen.getByText("Phase 2")).toBeInTheDocument();
    });
  });
});
