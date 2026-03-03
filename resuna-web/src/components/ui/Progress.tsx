import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "error";
  showLabel?: boolean;
  className?: string;
}

export function Progress({
  value,
  max = 100,
  size = "md",
  variant = "default",
  showLabel = false,
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const variants = {
    default: "bg-orange-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  };

  // Auto variant based on percentage
  const autoVariant = percentage >= 80 ? "bg-green-500" : percentage >= 60 ? "bg-orange-500" : "bg-red-500";
  const barColor = variant === "default" ? autoVariant : variants[variant];

  return (
    <div className={cn("w-full", className)} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className="flex items-center gap-3">
        <div className={cn("flex-1 bg-gray-200 rounded-full overflow-hidden", sizes[size])}>
          <div
            className={cn("h-full rounded-full transition-all duration-500 ease-out", barColor)}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <span className="text-sm font-semibold text-gray-700 min-w-[3rem] text-right">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = "md",
  showLabel = true,
  className,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: { width: 48, strokeWidth: 4, fontSize: 14 },
    md: { width: 80, strokeWidth: 6, fontSize: 20 },
    lg: { width: 120, strokeWidth: 8, fontSize: 28 },
  };

  const { width, strokeWidth, fontSize } = sizes[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const color = percentage >= 80 ? "#22C55E" : percentage >= 60 ? "#F97316" : "#EF4444";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={width} height={width} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke="#E7E5E4"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showLabel && (
        <span
          className="absolute inset-0 flex items-center justify-center font-bold text-gray-900"
          style={{ fontSize }}
        >
          {Math.round(percentage)}
        </span>
      )}
    </div>
  );
}
