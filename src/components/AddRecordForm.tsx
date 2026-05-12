"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  editTarget?: { date: string; amount: number } | null;
  onEditDone?: () => void;
}

export default function AddRecordForm({ editTarget, onEditDone }: Props) {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editTarget) {
      setDate(editTarget.date);
      setAmount(editTarget.amount.toLocaleString("ko-KR"));
    }
  }, [editTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const raw = amount.replace(/,/g, "");
    if (!raw || isNaN(Number(raw))) {
      setError("올바른 금액을 입력해주세요");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, amount: raw }),
    });
    setLoading(false);
    if (res.ok) {
      setDate(new Date().toISOString().slice(0, 10));
      setAmount("");
      onEditDone?.();
      router.refresh();
    } else {
      setError("저장 실패");
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, "");
    if (raw === "" || /^\d+$/.test(raw)) {
      setAmount(raw ? Number(raw).toLocaleString("ko-KR") : "");
    }
  };

  const isEditing = !!editTarget;

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-zinc-100">
          {isEditing ? "잔고 수정" : "잔고 입력"}
        </h2>
        {isEditing && (
          <button
            type="button"
            onClick={() => {
              setDate(new Date().toISOString().slice(0, 10));
              setAmount("");
              onEditDone?.();
            }}
            className="text-xs text-zinc-600 hover:text-zinc-400"
          >
            취소
          </button>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-sm text-zinc-500 mb-1 block">날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="text-sm text-zinc-500 mb-1 block">총액 (원)</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="10,000,000"
            value={amount}
            onChange={handleAmountChange}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className={`text-white rounded-xl py-2 text-sm font-medium disabled:opacity-50 transition-colors ${
            isEditing
              ? "bg-amber-500 hover:bg-amber-600"
              : "bg-indigo-500 hover:bg-indigo-600"
          }`}
        >
          {loading ? "저장 중..." : isEditing ? "수정 완료" : "저장"}
        </button>
      </div>
    </form>
  );
}
