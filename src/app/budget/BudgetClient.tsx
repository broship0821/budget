"use client";

import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const CATEGORIES = ["고정비", "변동비", "생활비", "경조사비", "여가비", "용돈", "헌금", "교통비", "의료비"] as const;
type Category = (typeof CATEGORIES)[number];

const COLORS: Record<Category, string> = {
  고정비: "#3b82f6",
  변동비: "#10b981",
  생활비: "#f59e0b",
  경조사비: "#ec4899",
  여가비: "#8b5cf6",
  용돈: "#f97316",
  헌금: "#14b8a6",
  교통비: "#6366f1",
  의료비: "#ef4444",
};

function formatAmount(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export default function BudgetClient() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [expenses, setExpenses] = useState<Record<Category, number>>(
    Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>
  );
  const [editing, setEditing] = useState<Category | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState<Category | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/expenses?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((data: { category: string; amount: number }[]) => {
        const next = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
        for (const e of data) {
          if (e.category in next) next[e.category as Category] = e.amount;
        }
        setExpenses(next);
      });
  }, [year, month]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const prevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  };

  const startEdit = (cat: Category) => {
    setEditing(cat);
    setEditValue(expenses[cat] === 0 ? "" : String(expenses[cat]));
  };

  const commitEdit = async (cat: Category) => {
    const amount = parseInt(editValue.replace(/,/g, "")) || 0;
    setEditing(null);
    setEditValue("");
    if (amount === expenses[cat]) return;
    setSaving(cat);
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month, category: cat, amount }),
    });
    setExpenses((prev) => ({ ...prev, [cat]: amount }));
    setSaving(null);
  };

  const total = CATEGORIES.reduce((sum, c) => sum + expenses[c], 0);

  const pieData = CATEGORIES.filter((c) => expenses[c] > 0).map((c) => ({
    name: c,
    value: expenses[c],
  }));

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-lg mx-auto px-4 py-6 pb-10">
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="text-zinc-400 hover:text-zinc-100 text-lg px-2 py-1 transition-colors">
            ◀
          </button>
          <h1 className="text-lg font-bold text-zinc-100">
            {year}년 {month}월
          </h1>
          <button onClick={nextMonth} className="text-zinc-400 hover:text-zinc-100 text-lg px-2 py-1 transition-colors">
            ▶
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => startEdit(cat)}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-left hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[cat] }} />
                <span className="text-sm text-zinc-400">{cat}</span>
                {saving === cat && <span className="ml-auto text-xs text-zinc-600">저장 중...</span>}
              </div>
              {editing === cat ? (
                <input
                  ref={inputRef}
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => commitEdit(cat)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit(cat);
                    if (e.key === "Escape") { setEditing(null); setEditValue(""); }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-transparent text-zinc-100 font-semibold text-base outline-none border-b border-indigo-500 pb-0.5"
                  placeholder="0"
                />
              ) : (
                <p className={`font-semibold text-base ${expenses[cat] === 0 ? "text-zinc-700" : "text-zinc-100"}`}>
                  {formatAmount(expenses[cat])}
                </p>
              )}
            </button>
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-5">
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-400">총 지출</span>
            <span className="text-xl font-bold text-zinc-100">{formatAmount(total)}</span>
          </div>
        </div>

        {pieData.length > 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <h2 className="font-semibold text-zinc-100 mb-4">카테고리 비중</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name as Category]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [typeof value === "number" ? formatAmount(value) : "-"]}
                  contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }}
                  labelStyle={{ color: "#a1a1aa" }}
                  itemStyle={{ color: "#f4f4f5" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[entry.name as Category] }} />
                  <span className="text-xs text-zinc-400 truncate">{entry.name}</span>
                  <span className="text-xs text-zinc-500 ml-auto">
                    {total > 0 ? Math.round((entry.value / total) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center text-sm text-zinc-600 py-10">
            카테고리 카드를 눌러 지출을 입력해보세요
          </div>
        )}
      </div>
    </div>
  );
}
