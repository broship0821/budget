"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Record {
  date: string;
  amount: number;
  dailyReturn: number | null;
}

interface Props {
  records: Record[];
  mode: "amount" | "return";
}

export default function PortfolioChart({ records, mode }: Props) {
  const data =
    mode === "amount"
      ? records.map((r) => ({ date: r.date.slice(5), value: r.amount }))
      : records
          .filter((r) => r.dailyReturn !== null)
          .map((r) => ({ date: r.date.slice(5), value: r.dailyReturn }));

  const formatY = (v: number) =>
    mode === "amount"
      ? `${(v / 10000).toFixed(0)}만`
      : `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;

  const formatTooltip = (v: number) =>
    mode === "amount"
      ? [`${v.toLocaleString("ko-KR")}원`, "잔고"]
      : [`${v > 0 ? "+" : ""}${v.toFixed(2)}%`, "일일수익률"];

  const lineColor = mode === "amount" ? "#818cf8" : "#34d399";

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#71717a" }} />
        <YAxis tickFormatter={formatY} tick={{ fontSize: 11, fill: "#71717a" }} width={52} />
        <Tooltip
          formatter={formatTooltip}
          contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "12px", color: "#f4f4f5" }}
          labelStyle={{ color: "#a1a1aa" }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={lineColor}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: lineColor }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
