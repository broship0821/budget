import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const records = await prisma.expense.findMany({
    orderBy: [{ year: "asc" }, { month: "asc" }, { category: "asc" }],
  });

  type MonthEntry = { year: number; month: number; label: string; categories: Record<string, number>; total: number };
  const map = new Map<string, MonthEntry>();

  for (const r of records) {
    const key = `${r.year}-${String(r.month).padStart(2, "0")}`;
    if (!map.has(key)) {
      map.set(key, {
        year: r.year,
        month: r.month,
        label: `${r.year}.${String(r.month).padStart(2, "0")}`,
        categories: {},
        total: 0,
      });
    }
    const entry = map.get(key)!;
    entry.categories[r.category] = Number(r.amount);
    entry.total += Number(r.amount);
  }

  return NextResponse.json(Array.from(map.values()));
}
