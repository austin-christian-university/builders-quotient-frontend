// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { RadarChart } from "./RadarChart";

const FIVE_CATEGORIES = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"];
const EIGHT_CATEGORIES = ["A", "B", "C", "D", "E", "F", "G", "H"];
const TWELVE_CATEGORIES = [
  "Cat1", "Cat2", "Cat3", "Cat4", "Cat5", "Cat6",
  "Cat7", "Cat8", "Cat9", "Cat10", "Cat11", "Cat12",
];
const TWENTY_CATEGORIES = Array.from({ length: 20 }, (_, i) => `Dim${i + 1}`);

const makeScores = (n: number, value = 60) => Array(n).fill(value);

describe("RadarChart", () => {
  it("renders an SVG element", () => {
    const { container } = render(
      <RadarChart
        categories={FIVE_CATEGORIES}
        studentScores={makeScores(5)}
        accentColor="#4da3ff"
      />
    );
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("renders the correct number of axis lines (5 categories)", () => {
    const { container } = render(
      <RadarChart
        categories={FIVE_CATEGORIES}
        studentScores={makeScores(5)}
        accentColor="#4da3ff"
      />
    );
    const axisLines = container.querySelectorAll("[data-radar='axis']");
    expect(axisLines).toHaveLength(5);
  });

  it("renders the correct number of axis lines (8 categories)", () => {
    const { container } = render(
      <RadarChart
        categories={EIGHT_CATEGORIES}
        studentScores={makeScores(8)}
        accentColor="#4da3ff"
      />
    );
    const axisLines = container.querySelectorAll("[data-radar='axis']");
    expect(axisLines).toHaveLength(8);
  });

  it("renders the correct number of axis lines (12 categories)", () => {
    const { container } = render(
      <RadarChart
        categories={TWELVE_CATEGORIES}
        studentScores={makeScores(12)}
        accentColor="#4da3ff"
      />
    );
    const axisLines = container.querySelectorAll("[data-radar='axis']");
    expect(axisLines).toHaveLength(12);
  });

  it("renders the correct number of axis lines (20 categories)", () => {
    const { container } = render(
      <RadarChart
        categories={TWENTY_CATEGORIES}
        studentScores={makeScores(20)}
        accentColor="#e9b949"
      />
    );
    const axisLines = container.querySelectorAll("[data-radar='axis']");
    expect(axisLines).toHaveLength(20);
  });

  it("renders 4 grid ring polygons", () => {
    const { container } = render(
      <RadarChart
        categories={FIVE_CATEGORIES}
        studentScores={makeScores(5)}
        accentColor="#4da3ff"
      />
    );
    const gridRings = container.querySelectorAll("[data-radar='grid']");
    expect(gridRings).toHaveLength(4);
  });

  it("renders student polygon (total polygons = 4 grid rings + 1 student)", () => {
    const { container } = render(
      <RadarChart
        categories={FIVE_CATEGORIES}
        studentScores={makeScores(5)}
        accentColor="#4da3ff"
      />
    );
    const polygons = container.querySelectorAll("polygon");
    // 4 grid rings + 1 student polygon
    expect(polygons).toHaveLength(5);
  });

  it("renders student polygon without corpus overlay when corpusScores omitted", () => {
    const { container } = render(
      <RadarChart
        categories={EIGHT_CATEGORIES}
        studentScores={makeScores(8)}
        accentColor="#4da3ff"
      />
    );
    const corpusPolygon = container.querySelector("[data-radar='corpus']");
    expect(corpusPolygon).toBeNull();
  });

  it("renders corpus polygon when corpusScores provided", () => {
    const { container } = render(
      <RadarChart
        categories={FIVE_CATEGORIES}
        studentScores={makeScores(5)}
        corpusScores={makeScores(5, 70)}
        accentColor="#4da3ff"
      />
    );
    const corpusPolygon = container.querySelector("[data-radar='corpus']");
    expect(corpusPolygon).not.toBeNull();
  });

  it("polygon count increases by 1 when corpusScores provided", () => {
    const withoutCorpus = render(
      <RadarChart
        categories={FIVE_CATEGORIES}
        studentScores={makeScores(5)}
        accentColor="#4da3ff"
      />
    );
    const withCorpus = render(
      <RadarChart
        categories={FIVE_CATEGORIES}
        studentScores={makeScores(5)}
        corpusScores={makeScores(5, 70)}
        accentColor="#4da3ff"
      />
    );

    const countWithout = withoutCorpus.container.querySelectorAll("polygon").length;
    const countWith = withCorpus.container.querySelectorAll("polygon").length;
    expect(countWith).toBe(countWithout + 1);
  });

  it("corpus polygon has dashed stroke", () => {
    const { container } = render(
      <RadarChart
        categories={FIVE_CATEGORIES}
        studentScores={makeScores(5)}
        corpusScores={makeScores(5, 70)}
        accentColor="#4da3ff"
      />
    );
    const corpus = container.querySelector("[data-radar='corpus']");
    expect(corpus?.getAttribute("stroke-dasharray")).toBe("4 4");
  });

  it("renders category labels as text elements", () => {
    const { container } = render(
      <RadarChart
        categories={FIVE_CATEGORIES}
        studentScores={makeScores(5)}
        accentColor="#4da3ff"
      />
    );
    const labels = container.querySelectorAll("[data-radar='label']");
    expect(labels).toHaveLength(5);
  });

  it("renders correct label text for each category", () => {
    const { container } = render(
      <RadarChart
        categories={FIVE_CATEGORIES}
        studentScores={makeScores(5)}
        accentColor="#4da3ff"
      />
    );
    const labels = container.querySelectorAll("[data-radar='label']");
    const texts = Array.from(labels).map((el) => el.textContent);
    expect(texts).toEqual(expect.arrayContaining(FIVE_CATEGORIES.map(c => c.toUpperCase())));
  });

  it("renders 8-point chart labels correctly", () => {
    const { container } = render(
      <RadarChart
        categories={EIGHT_CATEGORIES}
        studentScores={makeScores(8)}
        accentColor="#4da3ff"
      />
    );
    const labels = container.querySelectorAll("[data-radar='label']");
    expect(labels).toHaveLength(8);
  });

  it("renders 20-point chart labels correctly", () => {
    const { container } = render(
      <RadarChart
        categories={TWENTY_CATEGORIES}
        studentScores={makeScores(20)}
        accentColor="#e9b949"
      />
    );
    const labels = container.querySelectorAll("[data-radar='label']");
    expect(labels).toHaveLength(20);
  });

  it("renders student dots at each vertex", () => {
    const { container } = render(
      <RadarChart
        categories={FIVE_CATEGORIES}
        studentScores={makeScores(5)}
        accentColor="#4da3ff"
      />
    );
    const dots = container.querySelectorAll("[data-radar='dot']");
    expect(dots).toHaveLength(5);
  });

  it("uses the provided accentColor for student polygon stroke", () => {
    const { container } = render(
      <RadarChart
        categories={FIVE_CATEGORIES}
        studentScores={makeScores(5)}
        accentColor="#e9b949"
      />
    );
    const studentPolygon = container.querySelector("[data-radar='student']");
    expect(studentPolygon?.getAttribute("stroke")).toBe("#e9b949");
  });

  it("applies custom className to svg element", () => {
    const { container } = render(
      <RadarChart
        categories={FIVE_CATEGORIES}
        studentScores={makeScores(5)}
        accentColor="#4da3ff"
        className="my-custom-class"
      />
    );
    const svg = container.querySelector("svg");
    expect(svg?.classList.contains("my-custom-class")).toBe(true);
  });

  it("uses default size 480 for viewBox", () => {
    const { container } = render(
      <RadarChart
        categories={FIVE_CATEGORIES}
        studentScores={makeScores(5)}
        accentColor="#4da3ff"
      />
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 480 480");
  });

  it("uses custom size for viewBox", () => {
    const { container } = render(
      <RadarChart
        categories={FIVE_CATEGORIES}
        studentScores={makeScores(5)}
        accentColor="#4da3ff"
        size={320}
      />
    );
    const svg = container.querySelector("svg");
    // size=320 < 480 triggers sizeBasedPad=24, expanding the viewBox
    expect(svg?.getAttribute("viewBox")).toBe("-24 -24 368 368");
  });

  it("has aria-hidden on svg (decorative chart)", () => {
    const { container } = render(
      <RadarChart
        categories={FIVE_CATEGORIES}
        studentScores={makeScores(5)}
        accentColor="#4da3ff"
      />
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });
});
