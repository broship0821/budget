"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface LoginModalProps {
  isAuthed: boolean;
  onClose: () => void;
}

export default function LoginModal({ isAuthed, onClose }: LoginModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthed) setTimeout(() => inputRef.current?.focus(), 50);
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isAuthed, onClose]);

  const login = async () => {
    if (!password) return;
    setLoading(true);
    setError(false);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      onClose();
      router.refresh();
    } else {
      setError(true);
      setPassword("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    onClose();
    router.refresh();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {isAuthed ? (
          <>
            <p className="text-zinc-100 font-semibold mb-5">로그아웃할까요?</p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={logout}
                className="flex-1 py-2.5 rounded-xl bg-red-500/90 text-white text-sm hover:bg-red-500 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-zinc-100 font-semibold mb-4">비밀번호</p>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              onKeyDown={(e) => e.key === "Enter" && login()}
              className={`w-full bg-zinc-800 text-zinc-100 rounded-xl px-4 py-3 text-sm outline-none mb-1 border transition-colors ${
                error ? "border-red-500" : "border-transparent focus:border-indigo-500"
              }`}
              placeholder="비밀번호를 입력하세요"
            />
            {error && <p className="text-red-400 text-xs mb-3 mt-1">비밀번호가 틀렸어요</p>}
            <div className={error ? "" : "mt-3"}>
              <button
                onClick={login}
                disabled={loading || !password}
                className="w-full py-2.5 rounded-xl bg-indigo-500 text-white text-sm hover:bg-indigo-600 disabled:opacity-40 transition-colors"
              >
                {loading ? "확인 중..." : "로그인"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
