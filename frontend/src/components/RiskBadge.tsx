interface RiskBadgeProps {
  level: string;
  size?: "sm" | "md" | "lg";
}

const LEVEL_STYLES: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 border border-red-200",
  HIGH: "bg-orange-100 text-orange-700 border border-orange-200",
  MEDIUM: "bg-amber-100 text-amber-700 border border-amber-200",
  LOW: "bg-green-100 text-green-700 border border-green-200",
};

export default function RiskBadge({ level, size = "md" }: RiskBadgeProps) {
  const sizeClass = size === "sm" ? "text-[10px] px-1.5 py-0.5" : size === "lg" ? "text-xs px-3 py-1" : "text-[11px] px-2 py-0.5";
  return (
    <span className={`font-mono font-semibold tracking-wider uppercase rounded-sm ${sizeClass} ${LEVEL_STYLES[level] || LEVEL_STYLES.LOW}`}>
      {level}
    </span>
  );
}
