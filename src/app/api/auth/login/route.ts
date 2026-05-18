import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, makeSessionToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!verifyPassword(password)) {
    return NextResponse.json({ error: "wrong password" }, { status: 401 });
  }
  const cookieStore = await cookies();
  cookieStore.set("session", makeSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return NextResponse.json({ ok: true });
}
