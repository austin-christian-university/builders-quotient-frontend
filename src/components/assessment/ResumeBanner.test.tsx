// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { ResumeBanner } from "./ResumeBanner";

const mockSearchParams = new Map<string, string>();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams.get(key) ?? null,
  }),
}));

beforeEach(() => {
  mockSearchParams.clear();
});

describe("ResumeBanner", () => {
  it("renders nothing when resume param is absent", () => {
    const { container } = render(<ResumeBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when resume=false", () => {
    mockSearchParams.set("resume", "false");
    const { container } = render(<ResumeBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders banner when resume=true", () => {
    mockSearchParams.set("resume", "true");
    render(<ResumeBanner />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/in the middle of your assessment/i)).toBeInTheDocument();
  });

  it("dismisses when close button is clicked", async () => {
    mockSearchParams.set("resume", "true");
    const user = userEvent.setup();

    render(<ResumeBanner />);

    expect(screen.getByRole("status")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /dismiss/i }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("mentions retaking in two hours", () => {
    mockSearchParams.set("resume", "true");
    render(<ResumeBanner />);

    expect(screen.getByText(/take it again in two/i)).toBeInTheDocument();
  });
});
