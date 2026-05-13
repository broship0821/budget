import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULTS = ["고정비", "변동비", "생활비", "경조사비", "여가비", "용돈", "헌금", "교통비", "의료비"];

export async function GET() {
  let categories = await prisma.budgetCategory.findMany({ orderBy: { order: "asc" } });

  if (categories.length === 0) {
    await prisma.budgetCategory.createMany({
      data: DEFAULTS.map((name, order) => ({ name, order })),
    });
    categories = await prisma.budgetCategory.findMany({ orderBy: { order: "asc" } });
  }

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  const last = await prisma.budgetCategory.findFirst({ orderBy: { order: "desc" } });
  const category = await prisma.budgetCategory.create({
    data: { name: name.trim(), order: (last?.order ?? -1) + 1 },
  });

  return NextResponse.json(category);
}
