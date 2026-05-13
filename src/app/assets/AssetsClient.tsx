"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

interface AssetItem {
  id: number;
  name: string;
  order: number;
}

interface HistoryEntry {
  year: number;
  month: number;
  total: number;
  byItem: Record<number, number>;
  label: string;
  change: number | null;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#6366f1"];

function formatAmount(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export default function AssetsClient() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [items, setItems] = useState<AssetItem[]>([]);
  const [records, setRecords] = useState<Record<number, number>>({});

  const [editing, setEditing] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  const [recordedAt, setRecordedAt] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AssetItem | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [historyPeriod, setHistoryPeriod] = useState(12);

  const loadItems = useCallback(() => {
    fetch("/api/assets/items")
      .then((r) => r.json())
      .then(setItems);
  }, []);

  const loadRecords = useCallback(() => {
    fetch(`/api/assets/records?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((data: { items: { itemId: number; amount: number }[]; recordedAt: string | null }) => {
        const map: Record<number, number> = {};
        for (const r of data.items) map[r.itemId] = r.amount;
        setRecords(map);
        setRecordedAt(data.recordedAt);
      });
  }, [year, month]);

  useEffect(() => { loadItems(); }, [loadItems]);
  useEffect(() => { loadRecords(); }, [loadRecords]);
  useEffect(() => {
    fetch("/api/assets/history").then((r) => r.json()).then(setHistory);
  }, [records]);
  useEffect(() => {
    setSelectedItems(new Set(items.map((i) => i.id)));
  }, [items]);
  useEffect(() => { if (editing !== null) editRef.current?.focus(); }, [editing]);

  const prevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  };

  const startEdit = (itemId: number) => {
    setEditing(itemId);
    setEditValue(records[itemId] ? String(records[itemId]) : "");
  };

  const commitEdit = async (itemId: number) => {
    const amount = parseInt(editValue.replace(/,/g, "")) || 0;
    setEditing(null);
    setEditValue("");
    if (amount === (records[itemId] ?? 0)) return;
    await fetch("/api/assets/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month, itemId, amount }),
    });
    setRecords((prev) => ({ ...prev, [itemId]: amount }));
    setRecordedAt(new Date().toISOString());
  };

  const addItem = async () => {
    const name = newName.trim();
    if (!name) return;
    await fetch("/api/assets/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setNewName("");
    setAdding(false);
    loadItems();
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

    const from = items.findIndex((i) => i.id === dragId);
    const to = items.findIndex((i) => i.id === targetId);
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const reordered = next.map((item, idx) => ({ ...item, order: idx }));
    setItems(reordered);
    setDragId(null);
    setDragOverId(null);

    await fetch("/api/assets/items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reordered.map(({ id, order }) => ({ id, order }))),
    });
  };

  const copyFromPrevMonth = async () => {
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonth = month === 1 ? 12 : month - 1;
    const res = await fetch("/api/assets/copy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromYear: prevYear, fromMonth: prevMonth, toYear: year, toMonth: month }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const map: Record<number, number> = {};
    for (const r of data.items) map[r.itemId] = r.amount;
    setRecords(map);
    setRecordedAt(data.recordedAt);
  };

  const deleteItem = async (id: number) => {
    await fetch(`/api/assets/items/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((item) => item.id !== id));
    setRecords((prev) => { const next = { ...prev }; delete next[id]; return next; });
  };

  const total = items.reduce((sum, item) => sum + (records[item.id] ?? 0), 0);

  const chartData = history.map((e, idx) => {
    const displayTotal = items
      .filter((item) => selectedItems.has(item.id))
      .reduce((sum, item) => sum + (e.byItem[item.id] ?? 0), 0);
    const prevTotal = idx > 0
      ? items.filter((item) => selectedItems.has(item.id))
          .reduce((sum, item) => sum + (history[idx - 1].byItem[item.id] ?? 0), 0)
      : null;
    return { ...e, displayTotal, change: prevTotal !== null ? displayTotal - prevTotal : null };
  });

  const pieData = items
    .map((item, i) => ({ name: item.name, value: records[item.id] ?? 0, color: COLORS[i % COLORS.length] }))
    .filter((d) => d.value > 0);

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-lg mx-auto px-4 py-6 pb-10">

        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="text-zinc-400 hover:text-zinc-100 text-lg px-2 py-1 transition-colors">◀</button>
          <h1 className="text-lg font-bold text-zinc-100">{year}년 {month}월</h1>
          <button onClick={nextMonth} className="text-zinc-400 hover:text-zinc-100 text-lg px-2 py-1 transition-colors">▶</button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-5">
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-400">총 자산</span>
            <button
              onClick={copyFromPrevMonth}
              className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors"
              title="전월 데이터를 현재 달로 복사"
            >
              전월 복사
            </button>
            <span className="text-xl font-bold text-zinc-100">{formatAmount(total)}</span>
          </div>
          {recordedAt && (
            <p className="text-xs text-zinc-600 text-right mt-1">
              기록일: {new Date(recordedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}
        </div>

        {items.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-5">
            <div className="divide-y divide-zinc-800">
              {items.map((item, i) => (
                <div
                  key={item.id}
                  onDragOver={(e) => onDragOver(e, item.id)}
                  onDrop={(e) => onDrop(e, item.id)}
                  className={`flex items-center px-4 py-3 transition-opacity ${
                    dragId === item.id ? "opacity-30" : "opacity-100"
                  } ${dragOverId === item.id && dragId !== item.id ? "border-t-2 border-indigo-500" : ""}`}
                >
                  <div
                    draggable
                    onDragStart={(e) => onDragStart(e, item.id)}
                    onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                    className="cursor-grab active:cursor-grabbing mr-3 text-zinc-700 hover:text-zinc-500 select-none flex-shrink-0"
                  >
                    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                      <circle cx="3" cy="2.5" r="1.5"/><circle cx="7" cy="2.5" r="1.5"/>
                      <circle cx="3" cy="7" r="1.5"/><circle cx="7" cy="7" r="1.5"/>
                      <circle cx="3" cy="11.5" r="1.5"/><circle cx="7" cy="11.5" r="1.5"/>
                    </svg>
                  </div>
                  <span className="w-2 h-2 rounded-full flex-shrink-0 mr-3" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm text-zinc-300 flex-1">{item.name}</span>
                  <div className="flex items-center gap-3">
                    {editing === item.id ? (
                      <input
                        ref={editRef}
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => commitEdit(item.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit(item.id);
                          if (e.key === "Escape") { setEditing(null); setEditValue(""); }
                        }}
                        className="w-36 bg-transparent text-zinc-100 font-medium text-sm text-right outline-none border-b border-indigo-500 pb-0.5"
                        placeholder="0"
                      />
                    ) : (
                      <button
                        onClick={() => startEdit(item.id)}
                        className={`text-sm font-medium ${records[item.id] ? "text-zinc-200" : "text-zinc-600"} hover:text-zinc-100 transition-colors`}
                      >
                        {formatAmount(records[item.id] ?? 0)}
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="text-zinc-700 hover:text-red-400 transition-colors text-base leading-none"
                      title="삭제"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {adding ? (
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 mb-5">
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addItem();
                if (e.key === "Escape") { setAdding(false); setNewName(""); }
              }}
              className="flex-1 bg-transparent text-zinc-100 text-sm outline-none"
              placeholder="항목 이름 (예: 주식계좌)"
            />
            <button onClick={addItem} className="text-xs text-indigo-400 hover:text-indigo-300 px-2">추가</button>
            <button onClick={() => { setAdding(false); setNewName(""); }} className="text-xs text-zinc-600 hover:text-zinc-400">취소</button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full border border-dashed border-zinc-700 rounded-2xl py-3 text-sm text-zinc-600 hover:text-zinc-400 hover:border-zinc-500 transition-colors mb-5"
          >
            + 항목 추가
          </button>
        )}

        {pieData.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <h2 className="font-semibold text-zinc-100 mb-4">자산 구성</h2>
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
        )}

        {history.length >= 2 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mt-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-zinc-100">월별 자산 추이</h2>
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

            {selectedItems.size < items.length && total > 0 && (() => {
              const selectedTotal = items
                .filter((item) => selectedItems.has(item.id))
                .reduce((sum, item) => sum + (records[item.id] ?? 0), 0);
              const pct = (selectedTotal / total) * 100;
              return (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-zinc-500">선택 합계</span>
                  <span className="text-xs font-medium text-zinc-200">{formatAmount(selectedTotal)}</span>
                  <span className="text-xs text-zinc-500">({pct.toFixed(1)}%)</span>
                </div>
              );
            })()}

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSelectedItems(new Set(items.map((i) => i.id)))}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedItems.size === items.length
                    ? "bg-indigo-500 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                전체
              </button>
              {items.map((item, i) => {
                const color = COLORS[i % COLORS.length];
                const active = selectedItems.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedItems((prev) => {
                        // 전체 선택 상태에서 클릭 → solo
                        if (prev.size === items.length) return new Set([item.id]);
                        // solo 상태에서 자기 자신 클릭 → 전체로 복귀
                        if (prev.size === 1 && prev.has(item.id)) return new Set(items.map((i) => i.id));
                        // 그 외 → 일반 토글
                        const next = new Set(prev);
                        if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                        return next;
                      });
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      active ? "bg-zinc-700 text-zinc-100" : "bg-zinc-800 text-zinc-600"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: active ? color : "#52525b" }} />
                    {item.name}
                  </button>
                );
              })}
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={historyPeriod === 0 ? chartData : chartData.slice(-historyPeriod)} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(0, Math.ceil((historyPeriod === 0 ? chartData.length : Math.min(chartData.length, historyPeriod)) / 6) - 1)}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  domain={[
                    (min: number) => Math.floor(min * 0.998),
                    (max: number) => Math.ceil(max * 1.002),
                  ]}
                  tickFormatter={(v) => {
                    if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`;
                    if (v >= 10000) return `${(v / 10000).toFixed(0)}만`;
                    return String(v);
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const entry = payload[0].payload as typeof chartData[number];
                    return (
                      <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs">
                        <p className="text-zinc-400 mb-1">{entry.label}</p>
                        <p className="text-zinc-100 font-semibold">{formatAmount(entry.displayTotal)}</p>
                        {entry.change !== null && (
                          <p className={entry.change >= 0 ? "text-emerald-400" : "text-red-400"}>
                            {entry.change >= 0 ? "+" : ""}{formatAmount(entry.change)}
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="displayTotal" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 border-t border-zinc-800 pt-4">
              <div className="grid grid-cols-4 text-xs text-zinc-600 mb-2 px-1">
                <span>월</span>
                <span className="text-right">총 자산</span>
                <span className="text-right">증감</span>
                <span className="text-right">증감률</span>
              </div>
              <div className="space-y-1">
                {(historyPeriod === 0 ? chartData : chartData.slice(-historyPeriod)).slice().reverse().map((entry) => {
                  const prevTotal = entry.change !== null ? entry.displayTotal - entry.change : null;
                  const pct = prevTotal ? (entry.change! / prevTotal) * 100 : null;
                  const color = entry.change === null || entry.change === 0 ? "text-zinc-500"
                    : entry.change > 0 ? "text-emerald-400" : "text-red-400";
                  return (
                    <div key={entry.label} className="grid grid-cols-4 text-sm px-1 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
                      <span className="text-zinc-400 text-xs self-center">{entry.label}</span>
                      <span className="text-zinc-200 text-right text-xs self-center">{formatAmount(entry.displayTotal)}</span>
                      {entry.change === null ? (
                        <span className="text-zinc-700 text-right text-xs self-center">—</span>
                      ) : (
                        <span className={`text-right text-xs font-medium self-center ${color}`}>
                          {entry.change > 0 ? "+" : ""}{formatAmount(entry.change)}
                        </span>
                      )}
                      {pct === null ? (
                        <span className="text-zinc-700 text-right text-xs self-center">—</span>
                      ) : (
                        <span className={`text-right text-xs font-medium self-center ${color}`}>
                          {pct > 0 ? "+" : ""}{pct.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {items.length === 0 && !adding && (
          <p className="text-center text-sm text-zinc-600 mt-6">
            항목을 추가해 자산을 기록해보세요
          </p>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6" onClick={() => setDeleteTarget(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <p className="text-zinc-100 font-semibold mb-1">항목 삭제</p>
            <p className="text-sm text-zinc-400 mb-6">
              정말로 <span className="text-zinc-100 font-medium">'{deleteTarget.name}'</span> 항목을 삭제할까요?<br />
              <span className="text-red-400">모든 월의 금액 데이터도 함께 삭제돼요.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={async () => { await deleteItem(deleteTarget.id); setDeleteTarget(null); }}
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
