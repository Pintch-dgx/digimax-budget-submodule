import { DashboardWrapper } from "@/components/layout/DashboardWrapper";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Button } from "@/components/ui";
import Link from "next/link";
import { BudgetRequestsList } from "@/components/budget-requests/BudgetRequestsList";

export default async function BudgetRequestsPage() {
  return (
    <DashboardWrapper>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Richieste Budget</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Gestisci le richieste di budget e le approvazioni.
            </p>
          </div>
          <Link href="/budget-requests/new">
            <Button variant="primary" size="md">+ Nuova Richiesta Budget</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Richieste Budget</CardTitle>
            <CardDescription>Visualizza tutte le richieste di budget.</CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetRequestsList />
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
}
