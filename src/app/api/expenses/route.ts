import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? "");
  const month = parseInt(searchParams.get("month") ?? "");

  if (!year || !month) {
    return NextResponse.json({ error: "year and month required" }, { status: 400 });
  }

  const expenses = await prisma.expense.findMany({ where: { year, month } });

  return NextResponse.json(
    expenses.map((e) => ({ id: e.id, category: e.category, amount: Number(e.amount) }))
  );
}

export async function POST(req: NextRequest) {
  const { year, month, category, amount } = await req.json();

  if (!year || !month || !category || amount == null) {
    return NextResponse.json({ error: "year, month, category, amount required" }, { status: 400 });
  }

  const expense = await prisma.expense.upsert({
    where: { year_month_category: { year, month, category } },
    update: { amount: BigInt(amount) },
    create: { year, month, category, amount: BigInt(amount) },
  });

  return NextResponse.json({ id: expense.id, category: expense.category, amount: Number(expense.amount) });
}
