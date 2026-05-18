import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const PASSWORD = process.env.APP_PASSWORD ?? "";
const SECRET = process.env.AUTH_SECRET ?? "jusic-fallback-secret";

export function makeSessionToken(): string {
  return createHash("sha256").update(PASSWORD + ":" + SECRET).digest("hex");
}

export function verifyPassword(input: string): boolean {
  const expected = makeSessionToken();
  const actual = createHash("sha256").update(input + ":" + SECRET).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export async function getIsAuthed(): Promise<boolean> {
  if (!PASSWORD) return false;
  const cookieStore = await cookies();
  const session = cookieStore.get("session");
  if (!session?.value) return false;
  const expected = makeSessionToken();
  try {
    return timingSafeEqual(Buffer.from(session.value, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
