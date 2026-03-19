// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { CountdownDigit } from "../CountdownDigit";

describe("CountdownDigit", () => {
  it("renders the number", () => {
    render(
      <CountdownDigit
        number={3}
        onEnterComplete={() => {}}
        prefersReducedMotion={true}
      />
    );
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders static text when prefersReducedMotion is true", () => {
    const { container } = render(
      <CountdownDigit
        number={2}
        onEnterComplete={() => {}}
        prefersReducedMotion={true}
      />
    );
    expect(container.querySelector("span")).toBeInTheDocument();
  });
});
