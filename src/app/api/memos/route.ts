import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const memos = await prisma.memo.findMany();
  const result = { goal: "", thought: "" };
  for (const m of memos) {
    if (m.key === "goal" || m.key === "thought") result[m.key] = m.content;
  }
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { key, content } = await req.json();
  const VALID_KEYS = ["goal", "thought", "target_amount", "target_return"];
  if (!VALID_KEYS.includes(key)) {
    return NextResponse.json({ error: "invalid key" }, { status: 400 });
  }
  const memo = await prisma.memo.upsert({
    where: { key },
    update: { content },
    create: { key, content },
  });
  return NextResponse.json(memo);
}
