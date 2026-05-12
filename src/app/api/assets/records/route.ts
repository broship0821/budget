import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? "");
  const month = parseInt(searchParams.get("month") ?? "");

  if (!year || !month) {
    return NextResponse.json({ error: "year and month required" }, { status: 400 });
  }

  const records = await prisma.assetRecord.findMany({ where: { year, month } });
  const recordedAt = records.length > 0
    ? records.reduce((max, r) => r.updatedAt > max ? r.updatedAt : max, records[0].updatedAt).toISOString()
    : null;

  return NextResponse.json({
    items: records.map((r) => ({ itemId: r.itemId, amount: Number(r.amount) })),
    recordedAt,
  });
}

export async function POST(req: NextRequest) {
  const { year, month, itemId, amount } = await req.json();

  if (!year || !month || !itemId || amount == null) {
    return NextResponse.json({ error: "year, month, itemId, amount required" }, { status: 400 });
  }

  const record = await prisma.assetRecord.upsert({
    where: { year_month_itemId: { year, month, itemId } },
    update: { amount: BigInt(amount) },
    create: { year, month, itemId, amount: BigInt(amount) },
  });
  return NextResponse.json({ itemId: record.itemId, amount: Number(record.amount) });
}
