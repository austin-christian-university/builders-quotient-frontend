// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MobileWarningDialog } from "./MobileWarningDialog";

// Stub next/navigation — only router.push is used
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

// jsdom doesn't implement HTMLDialogElement.showModal / .close
beforeEach(() => {
  pushMock.mockReset();

  HTMLDialogElement.prototype.showModal ??= vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close ??= vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  });
});

describe("MobileWarningDialog", () => {
  it("renders heading and body text when open", () => {
    render(<MobileWarningDialog open onDismiss={() => {}} />);

    expect(screen.getByRole("heading", { name: /desktop recommended/i })).toBeInTheDocument();
    expect(screen.getByText(/webcam recording/i)).toBeInTheDocument();
  });

  it("opens the native dialog when open=true", () => {
    render(<MobileWarningDialog open onDismiss={() => {}} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("open");
  });

  it("does not open the dialog when open=false", () => {
    const { container } = render(<MobileWarningDialog open={false} onDismiss={() => {}} />);

    const dialog = container.querySelector("dialog");
    expect(dialog).not.toHaveAttribute("open");
  });

  it("calls onDismiss when 'Continue Anyway' is clicked", async () => {
    const onDismiss = vi.fn();
    render(<MobileWarningDialog open onDismiss={onDismiss} />);

    await userEvent.click(screen.getByRole("button", { name: /continue anyway/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("has an accessible close button that navigates home", async () => {
    render(<MobileWarningDialog open onDismiss={() => {}} />);

    const closeBtn = screen.getByRole("button", { name: /go back to home/i });
    expect(closeBtn).toBeInTheDocument();

    await userEvent.click(closeBtn);
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("shows the domain hint text", () => {
    render(<MobileWarningDialog open onDismiss={() => {}} />);

    expect(screen.getByText(/bq\.austinchristianu\.org/)).toBeInTheDocument();
  });
});
