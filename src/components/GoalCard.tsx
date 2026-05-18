"use client";

import { useState, useRef } from "react";

interface GoalCardProps {
  initialTargetAmount: number | null;
  initialTargetReturn: number | null;
  currentAmount: number | null;
  currentYearlyReturn?: number | null;
}

function formatKorean(n: number): string {
  if (n === 0) return "0원";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const eok = Math.floor(abs / 100_000_000);
  const man = Math.floor((abs % 100_000_000) / 10_000);
  if (eok > 0 && man > 0) return `${sign}${eok}억 ${man.toLocaleString("ko-KR")}만원`;
  if (eok > 0) return `${sign}${eok}억원`;
  if (man > 0) return `${sign}${man.toLocaleString("ko-KR")}만원`;
  return `${sign}${abs.toLocaleString("ko-KR")}원`;
}

async function saveMemo(key: string, content: string) {
  await fetch("/api/memos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, content }),
  });
}

export default function GoalCard({ initialTargetAmount, initialTargetReturn, currentAmount, currentYearlyReturn }: GoalCardProps) {
  const [targetAmount, setTargetAmount] = useState<number | null>(initialTargetAmount);
  const [targetReturn, setTargetReturn] = useState<number | null>(initialTargetReturn);
  const [editingAmount, setEditingAmount] = useState(false);
  const [editingReturn, setEditingReturn] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [returnInput, setReturnInput] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);
  const returnRef = useRef<HTMLInputElement>(null);

  const pct = targetAmount && currentAmount != null ? (currentAmount / targetAmount) * 100 : 0;
  const barPct = Math.min(pct, 100);
  const exceeded = pct >= 100;

  const startEditAmount = () => {
    setAmountInput(targetAmount ? String(targetAmount) : "");
    setEditingAmount(true);
    setTimeout(() => amountRef.current?.focus(), 0);
  };

  const commitAmount = async () => {
    const val = parseInt(amountInput.replace(/,/g, "")) || null;
    setTargetAmount(val);
    setEditingAmount(false);
    await saveMemo("target_amount", val ? String(val) : "");
  };

  const startEditReturn = () => {
    setReturnInput(targetReturn != null ? String(targetReturn) : "");
    setEditingReturn(true);
    setTimeout(() => returnRef.current?.focus(), 0);
  };

  const commitReturn = async () => {
    const raw = parseFloat(returnInput);
    const val = isNaN(raw) ? null : raw;
    setTargetReturn(val);
    setEditingReturn(false);
    await saveMemo("target_return", val != null ? String(val) : "");
  };

  const returnColor =
    currentYearlyReturn == null || targetReturn == null
      ? "text-zinc-400"
      : currentYearlyReturn >= targetReturn
      ? "text-emerald-400"
      : currentYearlyReturn >= targetReturn * 0.7
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <h2 className="font-semibold text-zinc-100 mb-4">목표 트래킹</h2>

      {/* 목표 금액 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500">목표 금액</span>
          {editingAmount ? (
            <input
              ref={amountRef}
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              onBlur={commitAmount}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitAmount();
                if (e.key === "Escape") setEditingAmount(false);
              }}
              className="w-40 text-right bg-transparent text-zinc-100 text-sm font-medium outline-none border-b border-indigo-500 pb-0.5"
              placeholder="0"
            />
          ) : (
            <button
              onClick={startEditAmount}
              className={`text-sm font-medium transition-colors hover:text-indigo-400 ${targetAmount ? "text-zinc-100" : "text-zinc-600"}`}
            >
              {targetAmount ? formatKorean(targetAmount) : "목표 설정"}
            </button>
          )}
        </div>

        {targetAmount && currentAmount != null ? (
          <>
            <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${exceeded ? "bg-emerald-500" : "bg-indigo-500"}`}
                style={{ width: `${barPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-sm font-bold ${exceeded ? "text-emerald-400" : "text-zinc-200"}`}>
                  {exceeded ? "목표 달성!" : `${Math.floor(pct)}%`}
                </span>
                <span className="text-xs text-zinc-600 ml-2">{formatKorean(currentAmount)}</span>
              </div>
              <span className="text-xs text-zinc-500">
                {exceeded
                  ? `+${formatKorean(currentAmount - targetAmount)} 초과`
                  : `남은 ${formatKorean(targetAmount - currentAmount)}`}
              </span>
            </div>
          </>
        ) : (
          <p className="text-xs text-zinc-600 mt-1">
            {targetAmount ? "자산 데이터가 없어요" : "목표 금액을 설정하면 달성률을 볼 수 있어요"}
          </p>
        )}
      </div>

      {/* 목표 수익률 */}
      <div className="border-t border-zinc-800 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500">목표 수익률 (연간)</span>
          {editingReturn ? (
            <div className="flex items-center gap-1">
              <input
                ref={returnRef}
                type="number"
                step="0.1"
                value={returnInput}
                onChange={(e) => setReturnInput(e.target.value)}
                onBlur={commitReturn}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitReturn();
                  if (e.key === "Escape") setEditingReturn(false);
                }}
                className="w-20 text-right bg-transparent text-zinc-100 text-sm font-medium outline-none border-b border-indigo-500 pb-0.5"
                placeholder="0"
              />
              <span className="text-sm text-zinc-500">%</span>
            </div>
          ) : (
            <button
              onClick={startEditReturn}
              className={`text-sm font-medium transition-colors hover:text-indigo-400 ${targetReturn != null ? "text-zinc-100" : "text-zinc-600"}`}
            >
              {targetReturn != null ? `${targetReturn > 0 ? "+" : ""}${targetReturn}%` : "목표 설정"}
            </button>
          )}
        </div>

        {targetReturn != null && currentYearlyReturn != null ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">현재 연간 수익률</span>
            <span className={`text-sm font-semibold ${returnColor}`}>
              {currentYearlyReturn > 0 ? "+" : ""}{currentYearlyReturn.toFixed(2)}%
              <span className="text-xs text-zinc-600 ml-1.5">
                / 목표 {targetReturn > 0 ? "+" : ""}{targetReturn}%
              </span>
            </span>
          </div>
        ) : (
          <p className="text-xs text-zinc-600 mt-1">
            {targetReturn != null ? "수익률 데이터가 없어요" : "목표 수익률을 설정하면 비교해 드려요"}
          </p>
        )}
      </div>
    </div>
  );
}
