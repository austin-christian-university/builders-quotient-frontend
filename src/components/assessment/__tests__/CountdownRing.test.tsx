// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { CountdownRing } from "../CountdownRing";

// Controls whether IntersectionObserver reports the element as in-view
let intersectionIsIntersecting = true;

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

  // jsdom doesn't implement IntersectionObserver
  globalThis.IntersectionObserver = class IntersectionObserver {
    constructor(private cb: IntersectionObserverCallback) {}
    observe(target: Element) {
      this.cb(
        [{ isIntersecting: intersectionIsIntersecting, target } as IntersectionObserverEntry],
        this as unknown as globalThis.IntersectionObserver,
      );
    }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof globalThis.IntersectionObserver;
});

beforeEach(() => {
  intersectionIsIntersecting = true;
});

describe("CountdownRing", () => {
  describe("think mode", () => {
    it("renders countdown seconds and Think label", () => {
      render(<CountdownRing secondsRemaining={15} totalSeconds={30} mode="think" />);
      expect(screen.getByText("15")).toBeInTheDocument();
      expect(screen.getByText("Think\u2026")).toBeInTheDocument();
    });

    it("shows Done Thinking button after 5s elapsed", () => {
      render(<CountdownRing secondsRemaining={20} totalSeconds={30} mode="think" onStopEarly={() => {}} />);
      expect(screen.getByText("Done Thinking")).toBeInTheDocument();
    });

    it("hides Done Thinking button before 5s elapsed", () => {
      render(<CountdownRing secondsRemaining={28} totalSeconds={30} mode="think" onStopEarly={() => {}} />);
      expect(screen.queryByText("Done Thinking")).not.toBeInTheDocument();
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

  describe("floating timer badge", () => {
    it("renders floating badge when inline timer is out of view", () => {
      intersectionIsIntersecting = false;
      render(<CountdownRing secondsRemaining={20} totalSeconds={30} mode="recording" onStopEarly={() => {}} />);
      // The floating badge renders a second timer via portal to document.body
      const timers = screen.getAllByRole("timer");
      expect(timers.length).toBeGreaterThanOrEqual(2);
    });

    it("does not render floating badge when inline timer is in view", () => {
      intersectionIsIntersecting = true;
      render(<CountdownRing secondsRemaining={20} totalSeconds={30} mode="recording" onStopEarly={() => {}} />);
      const timers = screen.getAllByRole("timer");
      expect(timers).toHaveLength(1);
    });

    it("shows Done button in floating badge when canStopEarly", () => {
      intersectionIsIntersecting = false;
      render(<CountdownRing secondsRemaining={20} totalSeconds={30} mode="recording" onStopEarly={() => {}} />);
      // Both inline and floating should have a Done button
      const doneButtons = screen.getAllByText(/done/i);
      expect(doneButtons.length).toBeGreaterThanOrEqual(2);
    });
  });
});
