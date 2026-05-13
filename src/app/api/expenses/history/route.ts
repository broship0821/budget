import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const records = await prisma.expense.findMany({
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });

  const monthlyMap = new Map<string, number>();
  for (const r of records) {
    const key = `${r.year}-${String(r.month).padStart(2, "0")}`;
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + Number(r.amount));
  }

  const entries = Array.from(monthlyMap.entries()).map(([key, total]) => {
    const [year, month] = key.split("-");
    return { year: parseInt(year), month: parseInt(month), total, label: `${year}.${month}` };
  });

  return NextResponse.json(
    entries.map((e, i) => ({
      ...e,
      change: i > 0 ? e.total - entries[i - 1].total : null,
    }))
  );
}
