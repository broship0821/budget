import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.assetItem.findMany({
    orderBy: [{ order: "asc" }, { id: "asc" }],
  });
  return NextResponse.json(items);
}

export async function PUT(req: NextRequest) {
  const items: { id: number; order: number }[] = await req.json();
  await Promise.all(
    items.map(({ id, order }) => prisma.assetItem.update({ where: { id }, data: { order } }))
  );
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const last = await prisma.assetItem.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const item = await prisma.assetItem.create({
    data: { name, order: (last?.order ?? -1) + 1 },
  });
  return NextResponse.json(item);
}
