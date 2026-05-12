"use client";

interface StatCardProps {
  label: string;
  value: number | null;
  isAmount?: boolean;
}

export default function StatCard({ label, value, isAmount }: StatCardProps) {
  const isPositive = value !== null && value > 0;
  const isNegative = value !== null && value < 0;

  const formatted = isAmount
    ? value !== null
      ? `${value.toLocaleString("ko-KR")}원`
      : "-"
    : value !== null
      ? `${isPositive ? "+" : ""}${value.toFixed(2)}%`
      : "-";

  return (
    <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
      <p className="text-sm text-zinc-500 mb-1">{label}</p>
      <p
        className={`text-xl font-bold ${
          isAmount
            ? "text-zinc-100"
            : isPositive
              ? "text-emerald-400"
              : isNegative
                ? "text-red-400"
                : "text-zinc-100"
        }`}
      >
        {formatted}
      </p>
    </div>
  );
}
