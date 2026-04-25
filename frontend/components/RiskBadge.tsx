import type { RiskLevel } from "@/lib/api";

const riskStyles: Record<RiskLevel, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-yellow-200 bg-yellow-50 text-yellow-700",
  high: "border-red-200 bg-red-50 text-red-700",
};

type RiskBadgeProps = {
  risk: RiskLevel;
};

export default function RiskBadge({ risk }: RiskBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${riskStyles[risk]}`}
    >
      {risk}
    </span>
  );
}
