import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { fromYear, fromMonth, toYear, toMonth } = await req.json();

  const fromRecords = await prisma.assetRecord.findMany({
    where: { year: fromYear, month: fromMonth },
  });

  if (fromRecords.length === 0) {
    return NextResponse.json({ error: "no data" }, { status: 404 });
  }

  await Promise.all(
    fromRecords.map((r) =>
      prisma.assetRecord.upsert({
        where: { year_month_itemId: { year: toYear, month: toMonth, itemId: r.itemId } },
        update: { amount: r.amount },
        create: { year: toYear, month: toMonth, itemId: r.itemId, amount: r.amount },
      })
    )
  );

  const newRecords = await prisma.assetRecord.findMany({ where: { year: toYear, month: toMonth } });
  const recordedAt = newRecords
    .reduce((max, r) => (r.updatedAt > max ? r.updatedAt : max), newRecords[0].updatedAt)
    .toISOString();

  return NextResponse.json({
    items: newRecords.map((r) => ({ itemId: r.itemId, amount: Number(r.amount) })),
    recordedAt,
  });
}
