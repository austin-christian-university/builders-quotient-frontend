import { cn } from "@/lib/utils";

// Swiss Ink "Grid Q": a square Q on a 4×4 grid whose tail is the one vermilion stroke.
const BQ_VERMILION = "#E8452C";

function BqMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M0 0H64V48H48V64H0Z M16 16V48H48V16Z"
      />
      <path fill={BQ_VERMILION} d="M31 41L41 31L64 54V64H54Z" />
    </svg>
  );
}

export { BqMark, BQ_VERMILION };
