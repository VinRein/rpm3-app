import clsx from "clsx";

interface BadgeProps {
  label: string;
  variant?: "default" | "A" | "B" | "C" | "success" | "warning";
  className?: string;
}

export function Badge({ label, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold",
        variant === "default" && "bg-[var(--surface-3)] text-[var(--text-muted)]",
        variant === "A" && "priority-A",
        variant === "B" && "priority-B",
        variant === "C" && "priority-C",
        variant === "success" && "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
        variant === "warning" && "bg-amber-500/15 text-amber-400 border border-amber-500/30",
        className
      )}
    >
      {label}
    </span>
  );
}
