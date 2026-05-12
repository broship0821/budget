"use client";

import { useState, useRef } from "react";

interface Props {
  memoKey: "goal" | "thought";
  label: string;
  initialContent: string;
  rows?: number;
  placeholder?: string;
}

export default function MemoCard({ memoKey, label, initialContent, rows = 4, placeholder }: Props) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = async (value: string) => {
    setStatus("saving");
    await fetch("/api/memos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: memoKey, content: value }),
    });
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(value), 800);
  };

  return (
    <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-zinc-100 text-sm">{label}</h2>
        <span className={`text-xs transition-opacity duration-300 ${status === "idle" ? "opacity-0" : "opacity-100"} ${status === "saving" ? "text-zinc-500" : "text-emerald-500"}`}>
          {status === "saving" ? "저장 중..." : "저장됨"}
        </span>
      </div>
      <textarea
        value={content}
        onChange={handleChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 placeholder-zinc-600 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
      />
    </div>
  );
}
