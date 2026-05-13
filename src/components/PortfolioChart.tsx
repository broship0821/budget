"use client";

import { useState } from "react";
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

const PERIODS = [
  { label: "30일", days: 30 },
  { label: "60일", days: 60 },
  { label: "90일", days: 90 },
  { label: "전체", days: 0 },
];

export default function PortfolioChart({ records, mode }: Props) {
  const [period, setPeriod] = useState(30);

  const sliced = period === 0 ? records : records.slice(-period);

  const data =
    mode === "amount"
      ? sliced.map((r) => ({ date: r.date.slice(5), value: r.amount }))
      : sliced
          .filter((r) => r.dailyReturn !== null)
          .map((r) => ({ date: r.date.slice(5), value: r.dailyReturn }));

  const xInterval = Math.max(0, Math.ceil(data.length / 6) - 1);

  const formatY = (v: number) =>
    mode === "amount"
      ? `${(v / 10000).toFixed(0)}만`
      : `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;


  const lineColor = mode === "amount" ? "#818cf8" : "#34d399";

  return (
    <div>
      <div className="flex gap-1 mb-3">
        {PERIODS.map(({ label, days }) => (
          <button
            key={days}
            onClick={() => setPeriod(days)}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              period === days
                ? "bg-zinc-600 text-zinc-100"
                : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#71717a" }} interval={xInterval} />
          <YAxis
            tickFormatter={formatY}
            tick={{ fontSize: 11, fill: "#71717a" }}
            width={52}
            domain={
              mode === "amount"
                ? [
                    (min: number) => Math.floor(min * 0.998),
                    (max: number) => Math.ceil(max * 1.002),
                  ]
                : undefined
            }
          />
          <Tooltip
            formatter={(v) => {
              const n = v as number;
              return mode === "amount"
                ? [`${n.toLocaleString("ko-KR")}원`, "잔고"]
                : [`${n > 0 ? "+" : ""}${n.toFixed(2)}%`, "일일수익률"];
            }}
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
    </div>
  );
}
