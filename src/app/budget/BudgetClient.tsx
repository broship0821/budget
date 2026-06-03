"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  DUMMY_BUDGET_CATEGORIES,
  DUMMY_EXPENSES,
  DUMMY_EXPENSE_HISTORY,
} from "@/lib/dummy";
import { downloadExcel } from "@/lib/excel";

const PALETTE = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#f97316", "#14b8a6", "#6366f1", "#ef4444", "#84cc16"];

interface BudgetCategory {
  id: number;
  name: string;
  order: number;
}

interface ExpenseHistory {
  year: number;
  month: number;
  total: number;
  label: string;
  change: number | null;
}

function formatAmount(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export default function BudgetClient({ isAuthed }: { isAuthed: boolean }) {
  const now = new Date();
  const [year, setYear] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() === 0 ? 12 : now.getMonth());
  const [categories, setCategories] = useState<BudgetCategory[]>(() => isAuthed ? [] : DUMMY_BUDGET_CATEGORIES);
  const [expenses, setExpenses] = useState<Record<string, number>>(() => isAuthed ? {} : DUMMY_EXPENSES);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<BudgetCategory | null>(null);
  const [undoStack, setUndoStack] = useState<{ category: string; amount: number }[]>([]);
  const [expenseHistory, setExpenseHistory] = useState<ExpenseHistory[]>(() => isAuthed ? [] : DUMMY_EXPENSE_HISTORY);
  const [historyPeriod, setHistoryPeriod] = useState(12);
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  const loadCategories = () => {
    if (!isAuthed) return;
    fetch("/api/budget/categories")
      .then((r) => r.json())
      .then(setCategories);
  };

  useEffect(() => { loadCategories(); }, []);

  useEffect(() => {
    if (!isAuthed) return;
    setUndoStack([]);
    fetch(`/api/expenses?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((data: { category: string; amount: number }[]) => {
        const next: Record<string, number> = {};
        for (const e of data) next[e.category] = e.amount;
        setExpenses(next);
      });
  }, [year, month, isAuthed]);

  useEffect(() => {
    if (!isAuthed) return;
    fetch("/api/expenses/history").then((r) => r.json()).then(setExpenseHistory);
  }, [expenses, isAuthed]);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  useEffect(() => { if (adding) addInputRef.current?.focus(); }, [adding]);

  const prevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  };

  const startEdit = (name: string) => {
    if (!isAuthed) return;
    setEditing(name);
    setEditValue(expenses[name] === 0 || expenses[name] == null ? "" : String(expenses[name]));
  };

  const saveExpense = useCallback(async (name: string, amount: number) => {
    if (!isAuthed) return;
    setSaving(name);
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month, category: name, amount }),
    });
    setExpenses((prev) => ({ ...prev, [name]: amount }));
    setSaving(null);
  }, [year, month, isAuthed]);

  const commitEdit = async (name: string) => {
    if (!isAuthed) return;
    const amount = parseInt(editValue.replace(/,/g, "")) || 0;
    setEditing(null);
    setEditValue("");
    if (amount === (expenses[name] ?? 0)) return;
    setUndoStack((prev) => [...prev.slice(-19), { category: name, amount: expenses[name] ?? 0 }]);
    await saveExpense(name, amount);
  };

  const undo = useCallback(async () => {
    if (!isAuthed) return;
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      saveExpense(last.category, last.amount);
      return prev.slice(0, -1);
    });
  }, [saveExpense, isAuthed]);

  useEffect(() => {
    if (!isAuthed) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.target instanceof Element && e.target.tagName !== "INPUT") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, isAuthed]);

  const addCategory = async () => {
    if (!isAuthed) return;
    const name = newName.trim();
    if (!name) return;
    await fetch("/api/budget/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setNewName("");
    setAdding(false);
    loadCategories();
  };

  const deleteCategory = async (cat: BudgetCategory) => {
    if (!isAuthed) return;
    await fetch(`/api/budget/categories/${cat.id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    setExpenses((prev) => { const next = { ...prev }; delete next[cat.name]; return next; });
    setDeleteTarget(null);
  };

  const onDragStart = (e: React.DragEvent, id: number) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    if (id !== dragId) setDragOverId(id);
  };

  const onDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (dragId === null || dragId === targetId) { setDragId(null); setDragOverId(null); return; }

    const from = categories.findIndex((c) => c.id === dragId);
    const to = categories.findIndex((c) => c.id === targetId);
    const next = [...categories];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const reordered = next.map((cat, idx) => ({ ...cat, order: idx }));
    setCategories(reordered);
    setDragId(null);
    setDragOverId(null);

    await fetch("/api/budget/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders: reordered.map(({ id, order }) => ({ id, order })) }),
    });
  };

  const total = categories.reduce((sum, c) => sum + (expenses[c.name] ?? 0), 0);
  const pieData = categories
    .map((c, i) => ({ name: c.name, value: expenses[c.name] ?? 0, color: PALETTE[i % PALETTE.length] }))
    .filter((d) => d.value > 0);

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-lg mx-auto px-4 py-6 pb-10">
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="text-zinc-400 hover:text-zinc-100 text-lg px-2 py-1 transition-colors">◀</button>
          <h1 className="text-lg font-bold text-zinc-100">{year}년 {month}월</h1>
          <button onClick={nextMonth} className="text-zinc-400 hover:text-zinc-100 text-lg px-2 py-1 transition-colors">▶</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {categories.map((cat, i) => {
            const color = PALETTE[i % PALETTE.length];
            const isDragging = dragId === cat.id;
            const isOver = dragOverId === cat.id && dragId !== cat.id;
            return (
              <div
                key={cat.id}
                onDragOver={(e) => onDragOver(e, cat.id)}
                onDrop={(e) => onDrop(e, cat.id)}
                onClick={() => startEdit(cat.name)}
                className={`bg-zinc-900 border rounded-2xl p-4 text-left transition-colors relative group
                  ${isAuthed ? "hover:border-zinc-600 cursor-pointer" : "cursor-default"}
                  ${isDragging ? "opacity-30" : "opacity-100"}
                  ${isOver ? "border-indigo-500" : "border-zinc-800"}
                `}
              >
                {isAuthed && (
                  <div
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); onDragStart(e, cat.id); }}
                    onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-2 left-2 text-zinc-700 hover:text-zinc-500 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing select-none"
                  >
                    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                      <circle cx="3" cy="2.5" r="1.5"/><circle cx="7" cy="2.5" r="1.5"/>
                      <circle cx="3" cy="7" r="1.5"/><circle cx="7" cy="7" r="1.5"/>
                      <circle cx="3" cy="11.5" r="1.5"/><circle cx="7" cy="11.5" r="1.5"/>
                    </svg>
                  </div>
                )}
                {isAuthed && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(cat); }}
                    className="absolute top-2 right-2 text-zinc-700 hover:text-red-400 transition-colors text-base leading-none opacity-0 group-hover:opacity-100"
                    title="삭제"
                  >
                    ×
                  </button>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-sm text-zinc-400 truncate">{cat.name}</span>
                  {saving === cat.name && <span className="ml-auto text-xs text-zinc-600">저장 중...</span>}
                </div>
                {isAuthed && editing === cat.name ? (
                  <input
                    ref={inputRef}
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitEdit(cat.name)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit(cat.name);
                      if (e.key === "Escape") { setEditing(null); setEditValue(""); }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-transparent text-zinc-100 font-semibold text-base outline-none border-b border-indigo-500 pb-0.5"
                    placeholder="0"
                  />
                ) : (
                  <p className={`font-semibold text-base ${(expenses[cat.name] ?? 0) === 0 ? "text-zinc-700" : "text-zinc-100"}`}>
                    {formatAmount(expenses[cat.name] ?? 0)}
                  </p>
                )}
              </div>
            );
          })}

          {isAuthed && (
            adding ? (
              <div className="bg-zinc-900 border border-indigo-500 rounded-2xl p-4 flex flex-col gap-2">
                <input
                  ref={addInputRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addCategory();
                    if (e.key === "Escape") { setAdding(false); setNewName(""); }
                  }}
                  className="bg-transparent text-zinc-100 text-sm outline-none w-full"
                  placeholder="카테고리 이름"
                />
                <div className="flex gap-2">
                  <button onClick={addCategory} className="text-xs text-indigo-400 hover:text-indigo-300">추가</button>
                  <button onClick={() => { setAdding(false); setNewName(""); }} className="text-xs text-zinc-600 hover:text-zinc-400">취소</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="bg-zinc-900 border border-dashed border-zinc-700 rounded-2xl p-4 text-zinc-600 hover:text-zinc-400 hover:border-zinc-500 transition-colors text-sm"
              >
                + 추가
              </button>
            )
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-5">
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-400">총 지출</span>
            <div className="flex items-center gap-3">
              {isAuthed && undoStack.length > 0 && (
                <button
                  onClick={undo}
                  className="text-xs text-zinc-500 hover:text-amber-400 transition-colors flex items-center gap-1"
                  title="되돌리기 (Ctrl+Z)"
                >
                  ↩ 되돌리기
                  {undoStack.length > 1 && <span className="text-zinc-600">({undoStack.length})</span>}
                </button>
              )}
              {expenseHistory.length > 0 && (
                <button
                  onClick={async () => {
                    const res = await fetch("/api/expenses/export");
                    const data: { label: string; categories: Record<string, number>; total: number }[] = await res.json();
                    const allCats = Array.from(new Set(data.flatMap((d) => Object.keys(d.categories))));
                    const rows = data.map((e) => {
                      const row: Record<string, unknown> = { 월: e.label };
                      for (const cat of allCats) row[cat + "(원)"] = e.categories[cat] ?? 0;
                      row["총지출(원)"] = e.total;
                      return row;
                    });
                    downloadExcel(rows, "가계부", "월별지출");
                  }}
                  className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors px-2 py-1 rounded border border-zinc-800 hover:border-emerald-800"
                >
                  ↓ 엑셀
                </button>
              )}
              <span className="text-xl font-bold text-zinc-100">{formatAmount(total)}</span>
            </div>
          </div>
        </div>

        {pieData.length > 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <h2 className="font-semibold text-zinc-100 mb-4">카테고리 비중</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
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
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
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

        {expenseHistory.filter((e) => e.total > 0).length >= 2 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mt-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-zinc-100">월별 지출 추이</h2>
              <div className="flex gap-1">
                {([{ label: "1년", months: 12 }, { label: "전체", months: 0 }] as const).map(({ label, months }) => (
                  <button
                    key={months}
                    onClick={() => setHistoryPeriod(months)}
                    className={`text-xs px-3 py-1 rounded-full transition-colors ${
                      historyPeriod === months
                        ? "bg-zinc-600 text-zinc-100"
                        : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const filtered = expenseHistory.filter((e) => e.total > 0);
              const chartData = historyPeriod === 0 ? filtered : filtered.slice(-historyPeriod);
              const nonZero = chartData.map((e) => e.total).filter((v) => v > 0);
              const yMin = nonZero.length > 0 ? Math.floor(Math.min(...nonZero) * 0.9) : 0;
              const yMax = nonZero.length > 0 ? Math.ceil(Math.max(...nonZero) * 1.05) : 100;
              return (
            <>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={chartData}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(0, Math.ceil(chartData.length / 6) - 1)}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  domain={[yMin, yMax]}
                  tickFormatter={(v) => {
                    if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`;
                    if (v >= 10000) return `${(v / 10000).toFixed(0)}만`;
                    return String(v);
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const entry = payload[0].payload as ExpenseHistory;
                    return (
                      <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs">
                        <p className="text-zinc-400 mb-1">{entry.label}</p>
                        <p className="text-zinc-100 font-semibold">{formatAmount(entry.total)}</p>
                        {entry.change !== null && (
                          <p className={entry.change >= 0 ? "text-red-400" : "text-emerald-400"}>
                            {entry.change >= 0 ? "+" : ""}{formatAmount(entry.change)}
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <div className="grid grid-cols-3 text-xs text-zinc-600 mb-2 px-1">
                <span>월</span>
                <span className="text-right">총 지출</span>
                <span className="text-right">전월 대비</span>
              </div>
              <div className="space-y-1">
                {chartData.slice().reverse().map((entry) => {
                  const color = entry.change === null || entry.change === 0
                    ? "text-zinc-500"
                    : entry.change > 0 ? "text-red-400" : "text-emerald-400";
                  return (
                    <div key={entry.label} className="grid grid-cols-3 px-1 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
                      <span className="text-zinc-400 text-xs self-center">{entry.label}</span>
                      <span className="text-zinc-200 text-right text-xs self-center">{formatAmount(entry.total)}</span>
                      {entry.change === null ? (
                        <span className="text-zinc-700 text-right text-xs self-center">—</span>
                      ) : (
                        <span className={`text-right text-xs font-medium self-center ${color}`}>
                          {entry.change > 0 ? "+" : ""}{formatAmount(entry.change)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            </>
              );
            })()}
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6" onClick={() => setDeleteTarget(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <p className="text-zinc-100 font-semibold mb-1">카테고리 삭제</p>
            <p className="text-sm text-zinc-400 mb-6">
              정말로 <span className="text-zinc-100 font-medium">'{deleteTarget.name}'</span> 카테고리를 삭제할까요?<br />
              <span className="text-red-400">모든 월의 지출 데이터도 함께 삭제돼요.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => deleteCategory(deleteTarget)}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
