import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.budgetCategory.findUnique({ where: { id: parseInt(id) } });
  if (!category) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.expense.deleteMany({ where: { category: category.name } });
  await prisma.budgetCategory.delete({ where: { id: parseInt(id) } });

  return NextResponse.json({ ok: true });
}
