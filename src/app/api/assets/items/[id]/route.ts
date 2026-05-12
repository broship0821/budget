import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/assets/items/[id]">) {
  const { id } = await ctx.params;
  await prisma.assetItem.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
