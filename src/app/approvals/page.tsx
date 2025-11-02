import { redirect } from "next/navigation";
import { DashboardWrapper } from "@/components/layout/DashboardWrapper";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { ApprovalsList } from "@/components/approvals/ApprovalsList";
import { getSession } from "@/lib/get-session";
import { isAdmin } from "@/lib/role-guards";

export default async function ApprovalsPage() {
  const session = await getSession();
  
  // Controlla se l'utente è admin, altrimenti reindirizza
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

        <Card className="border border-[var(--color-neutral-200)] bg-[var(--surface)] shadow-[var(--shadow-md)] dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]">
          <CardHeader>
            <CardTitle>Approvazioni in Attesa</CardTitle>
            <CardDescription>Richieste che necessitano della tua approvazione.</CardDescription>
          </CardHeader>
          <CardContent>
            <ApprovalsList />
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
}
