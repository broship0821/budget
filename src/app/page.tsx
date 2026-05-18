import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

async function getRecords() {
  const records = await prisma.portfolioRecord.findMany({
    orderBy: { date: "asc" },
  });

  return records.map((r, i) => {
    const prev = records[i - 1];
    const dailyReturn =
      prev && prev.amount !== 0n
        ? Number(((r.amount - prev.amount) * 10000n) / prev.amount) / 100
        : null;
    return {
      id: r.id,
      date: r.date.toISOString().slice(0, 10),
      amount: Number(r.amount),
      dailyReturn,
    };
  });
}

function getStats(records: ReturnType<typeof getRecords> extends Promise<infer T> ? T : never) {
  if (records.length === 0)
    return { daily: null, monthly: null, yearly: null, latestAmount: null, latestDate: null };

  const now = new Date();
  const latest = records[records.length - 1];
  const latestAmount = latest.amount;

  const calcReturn = (base: number) =>
    base !== 0 ? ((latestAmount - base) / base) * 100 : null;

  const findClosestBefore = (targetDate: Date) => {
    const target = targetDate.toISOString().slice(0, 10);
    let found = null;
    for (const r of records) {
      if (r.date <= target) found = r;
      else break;
    }
    return found;
  };

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  return {
    daily: (() => { const r = findClosestBefore(yesterday); return r ? calcReturn(r.amount) : null; })(),
    monthly: (() => { const r = findClosestBefore(monthStart); return r ? calcReturn(r.amount) : null; })(),
    yearly: (() => { const r = findClosestBefore(yearStart); return r ? calcReturn(r.amount) : null; })(),
    latestAmount,
    latestDate: latest.date,
  };
}

async function getMemos() {
  const memos = await prisma.memo.findMany();
  const result = { goal: "", thought: "" };
  for (const m of memos) {
    if (m.key === "goal" || m.key === "thought") result[m.key] = m.content;
  }
  return result;
}

export default async function Home() {
  const [records, memos] = await Promise.all([getRecords(), getMemos()]);
  const stats = getStats(records);

  return <DashboardClient records={records} stats={stats} memos={memos} />;
}
