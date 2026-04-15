import { redirect } from "next/navigation";
import { DashboardWrapper } from "@/components/layout/DashboardWrapper";
import { ApprovalsView } from "@/components/approvals/ApprovalsView";
import { getSession } from "@/lib/get-session";
import { isAdmin } from "@/lib/role-guards";

export default async function ApprovalsPage() {
  const session = await getSession();

  if (!(await isAdmin(session))) {
    redirect("/budget-requests");
  }

  return (
    <DashboardWrapper>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-neutral-900)]">Approvazioni</h1>
          <p className="text-sm text-[var(--color-neutral-500)]">
            Gestisci le approvazioni delle richieste di budget.
          </p>
        </div>

        <ApprovalsView />
      </div>
    </DashboardWrapper>
  );
}
