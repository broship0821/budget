import { prisma } from "@/lib/prisma";
import { getIsAuthed } from "@/lib/auth";
import AssetsClient from "./AssetsClient";

async function getGoals() {
  const memos = await prisma.memo.findMany({
    where: { key: { in: ["target_amount", "target_return"] } },
  });
  const map: Record<string, string> = {};
  for (const m of memos) map[m.key] = m.content;
  return {
    targetAmount: map.target_amount ? parseInt(map.target_amount) : null,
    targetReturn: map.target_return ? parseFloat(map.target_return) : null,
  };
}

export default async function AssetsPage() {
  const isAuthed = await getIsAuthed();

  if (!isAuthed) {
    return <AssetsClient isAuthed={false} initialTargetAmount={null} initialTargetReturn={null} />;
  }

  const goals = await getGoals();
  return (
    <AssetsClient
      isAuthed={true}
      initialTargetAmount={goals.targetAmount}
      initialTargetReturn={goals.targetReturn}
    />
  );
}
