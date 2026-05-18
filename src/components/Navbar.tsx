"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LoginModal from "./LoginModal";

export default function Navbar({ isAuthed }: { isAuthed: boolean }) {
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-10 bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-lg mx-auto px-4 flex items-center gap-1 py-3">
          <Link
            href="/"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              pathname === "/" ? "bg-indigo-500 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            일일 투자
          </Link>
          <Link
            href="/budget"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              pathname === "/budget" ? "bg-indigo-500 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            가계부
          </Link>
          <Link
            href="/assets"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              pathname === "/assets" ? "bg-indigo-500 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            자산 현황
          </Link>

          <button
            onClick={() => setShowModal(true)}
            className="ml-auto p-2 opacity-[0.12] hover:opacity-40 transition-opacity"
            aria-label="인증"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-zinc-300">
              <rect x="1.5" y="6" width="11" height="7.5" rx="1.5" fill="currentColor" />
              {isAuthed ? (
                <path d="M4 6V4a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              ) : (
                <path d="M4 6V4a3 3 0 0 1 6 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </nav>
      {showModal && <LoginModal isAuthed={isAuthed} onClose={() => setShowModal(false)} />}
    </>
  );
}
