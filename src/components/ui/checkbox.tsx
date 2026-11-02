"use client";

import { cn } from "@/lib/utils";

const checkmarkSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='%23111111' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E")`;

export function Checkbox({
  id,
  name,
  value,
  checked,
  onChange,
  className,
  children,
}: {
  id: string;
  name?: string;
  value?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-ink/[0.04] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-bg-base",
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer appearance-none border border-ink/50 bg-transparent transition-colors checked:border-primary checked:bg-primary focus-visible:outline-none"
        style={{
          backgroundImage: checked ? checkmarkSvg : "none",
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <span className="text-[length:var(--text-fluid-sm)] leading-snug text-text-secondary">
        {children}
      </span>
    </label>
  );
}
