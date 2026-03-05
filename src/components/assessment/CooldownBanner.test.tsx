// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CooldownBanner } from "./CooldownBanner";

// Mock next/navigation
const mockSearchParams = new Map<string, string>();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams.get(key) ?? null,
  }),
}));

beforeEach(() => {
  mockSearchParams.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("CooldownBanner", () => {
  it("renders nothing when cooldown param is absent", () => {
    const { container } = render(<CooldownBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when cooldown=false", () => {
    mockSearchParams.set("cooldown", "false");
    mockSearchParams.set("until", new Date(Date.now() + 3600_000).toISOString());

    const { container } = render(<CooldownBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when until is missing", () => {
    mockSearchParams.set("cooldown", "true");

    const { container } = render(<CooldownBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders countdown when cooldown is active", () => {
    const until = new Date(Date.now() + 90 * 60_000).toISOString(); // 90 min
    mockSearchParams.set("cooldown", "true");
    mockSearchParams.set("until", until);

    render(<CooldownBanner />);

    // Trigger the useEffect
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/you recently completed/i)).toBeInTheDocument();
    expect(screen.getByText("1h 30m")).toBeInTheDocument();
  });

  it("shows only minutes when less than 1 hour", () => {
    const until = new Date(Date.now() + 25 * 60_000).toISOString(); // 25 min
    mockSearchParams.set("cooldown", "true");
    mockSearchParams.set("until", until);

    render(<CooldownBanner />);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByText("25m")).toBeInTheDocument();
  });

  it("hides when countdown reaches zero", () => {
    const until = new Date(Date.now() + 60_000).toISOString(); // 1 min
    mockSearchParams.set("cooldown", "true");
    mockSearchParams.set("until", until);

    render(<CooldownBanner />);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByRole("status")).toBeInTheDocument();

    // Advance past the cooldown
    act(() => {
      vi.advanceTimersByTime(65_000);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders nothing when until is already past", () => {
    const until = new Date(Date.now() - 60_000).toISOString(); // 1 min ago
    mockSearchParams.set("cooldown", "true");
    mockSearchParams.set("until", until);

    render(<CooldownBanner />);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
