import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const records = await prisma.portfolioRecord.findMany({
    orderBy: { date: "asc" },
  });

  if (records.length === 0) return NextResponse.json({ daily: null, monthly: null, yearly: null });

  const now = new Date();
  const latest = records[records.length - 1];
  const latestAmount = Number(latest.amount);

  const calcReturn = (baseAmount: number) =>
    baseAmount !== 0 ? ((latestAmount - baseAmount) / baseAmount) * 100 : null;

  const findClosestBefore = (targetDate: Date) => {
    const target = targetDate.getTime();
    return records.reduce<(typeof records)[0] | null>((found, r) => {
      if (r.date.getTime() <= target) return r;
      return found;
    }, null);
  };

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const prevDay = findClosestBefore(yesterday);
  const prevMonth = findClosestBefore(monthStart);
  const prevYear = findClosestBefore(yearStart);

  return NextResponse.json({
    daily: prevDay ? calcReturn(Number(prevDay.amount)) : null,
    monthly: prevMonth ? calcReturn(Number(prevMonth.amount)) : null,
    yearly: prevYear ? calcReturn(Number(prevYear.amount)) : null,
    latestAmount,
    latestDate: latest.date.toISOString().slice(0, 10),
  });
}
