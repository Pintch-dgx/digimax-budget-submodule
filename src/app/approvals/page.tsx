import { DashboardWrapper } from "@/components/layout/DashboardWrapper";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { ApprovalsList } from "@/components/approvals/ApprovalsList";

export default function ApprovalsPage() {
  return (
    <DashboardWrapper>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold">Approvazioni</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestisci le approvazioni delle richieste di budget.
          </p>
        </div>

        <Card>
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
