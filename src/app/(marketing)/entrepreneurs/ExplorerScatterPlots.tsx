"use client";

import { ScatterPlot } from "@/components/entrepreneurs/ScatterPlot";

interface Dot {
  id: string;
  name: string;
  piD1: number;
  piD2: number;
  ciD1: number;
  ciD2: number;
  archetypeKey: string;
}

interface ExplorerScatterPlotsProps {
  dots: Dot[];
}

export function ExplorerScatterPlots({ dots }: ExplorerScatterPlotsProps) {
  const piDots = dots.map((d) => ({
    id: d.id,
    name: d.name,
    x: d.piD1,
    y: d.piD2,
    archetypeKey: d.archetypeKey,
  }));

  const ciDots = dots.map((d) => ({
    id: d.id,
    name: d.name,
    x: d.ciD1,
    y: d.ciD2,
    archetypeKey: d.archetypeKey,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
      <ScatterPlot
        dots={piDots}
        title="Practical Intelligence"
        xLabelNegative="Interpersonal"
        xLabelPositive="Analytical"
        yLabelNegative="Decisive"
        yLabelPositive="Exploratory"
      />
      <ScatterPlot
        dots={ciDots}
        title="Creative Intelligence"
        xLabelNegative="Validation"
        xLabelPositive="Insight"
        yLabelNegative="Process"
        yLabelPositive="Market"
      />
    </div>
  );
}
