import { getIsAuthed } from "@/lib/auth";
import BudgetClient from "./BudgetClient";

export default async function BudgetPage() {
  const isAuthed = await getIsAuthed();
  return <BudgetClient isAuthed={isAuthed} />;
}
