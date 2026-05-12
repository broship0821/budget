import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const records = await prisma.portfolioRecord.findMany({
    orderBy: { date: "asc" },
  });

  const data = records.map((r, i) => {
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

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { date, amount } = await req.json();

  if (!date || !amount) {
    return NextResponse.json({ error: "date and amount required" }, { status: 400 });
  }

  const record = await prisma.portfolioRecord.upsert({
    where: { date: new Date(date) },
    update: { amount: BigInt(amount) },
    create: { date: new Date(date), amount: BigInt(amount) },
  });

  return NextResponse.json({
    id: record.id,
    date: record.date.toISOString().slice(0, 10),
    amount: Number(record.amount),
  });
}
