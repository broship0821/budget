"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-10 bg-zinc-950 border-b border-zinc-800">
      <div className="max-w-lg mx-auto px-4 flex gap-1 py-3">
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
      </div>
    </nav>
  );
}
