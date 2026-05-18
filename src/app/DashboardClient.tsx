"use client";

import { useState } from "react";
import StatCard from "@/components/StatCard";
import PortfolioChart from "@/components/PortfolioChart";
import AddRecordForm from "@/components/AddRecordForm";
import MemoCard from "@/components/MemoCard";
import GoalCard from "@/components/GoalCard";

interface Record {
  id: number;
  date: string;
  amount: number;
  dailyReturn: number | null;
}

interface Stats {
  daily: number | null;
  monthly: number | null;
  yearly: number | null;
  latestAmount: number | null;
  latestDate: string | null;
}

interface Memos {
  goal: string;
  thought: string;
  target_amount: string;
  target_return: string;
}

export default function DashboardClient({ records, stats, memos }: { records: Record[]; stats: Stats; memos: Memos }) {
  const [chartMode, setChartMode] = useState<"amount" | "return">("amount");
  const [editTarget, setEditTarget] = useState<{ date: string; amount: number } | null>(null);

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-lg mx-auto px-4 py-6 pb-10">
        <h1 className="text-xl font-bold text-zinc-100 mb-1">내 주식 잔고</h1>
        {stats.latestDate && (
          <p className="text-sm text-zinc-500 mb-5">최근 기록: {stats.latestDate}</p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="col-span-2">
            <StatCard label="현재 잔고" value={stats.latestAmount} isAmount />
          </div>
          <StatCard label="일일 수익률" value={stats.daily} />
          <StatCard label="월간 수익률" value={stats.monthly} />
          <div className="col-span-2">
            <StatCard label="연간 수익률" value={stats.yearly} />
          </div>
        </div>

        <div className="mb-5">
          <GoalCard
            initialTargetAmount={memos.target_amount ? parseInt(memos.target_amount) : null}
            initialTargetReturn={memos.target_return ? parseFloat(memos.target_return) : null}
            currentAmount={stats.latestAmount}
            currentYearlyReturn={stats.yearly}
          />
        </div>

        <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-zinc-100">차트</h2>
            <div className="flex gap-1">
              <button
                onClick={() => setChartMode("amount")}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  chartMode === "amount"
                    ? "bg-indigo-500 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                잔고
              </button>
              <button
                onClick={() => setChartMode("return")}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  chartMode === "return"
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                수익률
              </button>
            </div>
          </div>
          {records.length > 1 ? (
            <PortfolioChart records={records} mode={chartMode} />
          ) : (
            <p className="text-sm text-zinc-600 text-center py-10">
              2개 이상의 기록이 필요해요
            </p>
          )}
        </div>

        <div className="mb-5">
          <MemoCard
            memoKey="goal"
            label="투자 목표"
            initialContent={memos.goal}
            rows={7}
            placeholder="목표 수익률, 목표 금액 등..."
          />
        </div>

        <AddRecordForm
          editTarget={editTarget}
          onEditDone={() => setEditTarget(null)}
        />

        {records.length > 0 && (
          <div className="mt-5 bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <h2 className="font-semibold text-zinc-100 mb-3">기록 목록</h2>
            <div className="space-y-1">
              {[...records].reverse().map((r, i, arr) => {
                const prev = arr[i + 1];
                const amountChange = prev ? r.amount - prev.amount : null;
                return (
                <div key={r.id} className="flex items-center gap-2 py-2 border-b border-zinc-800 last:border-0">
                  <span className="text-xs text-zinc-500 shrink-0">{r.date}</span>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="text-sm font-medium text-zinc-200">{r.amount.toLocaleString("ko-KR")}원</span>
                    {amountChange !== null && (
                      <span className={`text-xs ${amountChange > 0 ? "text-emerald-400" : amountChange < 0 ? "text-red-400" : "text-zinc-600"}`}>
                        {amountChange > 0 ? "+" : ""}{amountChange.toLocaleString("ko-KR")}원
                      </span>
                    )}
                    <span className={`text-xs ${
                      r.dailyReturn === null ? "text-zinc-700"
                        : r.dailyReturn > 0 ? "text-emerald-400"
                        : r.dailyReturn < 0 ? "text-red-400"
                        : "text-zinc-400"
                    }`}>
                      {r.dailyReturn === null ? "-" : `${r.dailyReturn > 0 ? "+" : ""}${r.dailyReturn.toFixed(2)}%`}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setEditTarget({ date: r.date, amount: r.amount });
                      window.scrollTo({ top: document.body.scrollHeight / 2, behavior: "smooth" });
                    }}
                    className="ml-3 text-zinc-700 hover:text-amber-400 transition-colors text-base"
                    title="수정"
                  >
                    ✎
                  </button>
                </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-5">
          <MemoCard
            memoKey="thought"
            label="생각 정리"
            initialContent={memos.thought}
            rows={7}
            placeholder="오늘의 시장 생각, 매매 근거, 반성 등..."
          />
        </div>
      </div>
    </div>
  );
}
