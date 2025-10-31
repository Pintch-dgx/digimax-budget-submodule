import { DashboardWrapper } from "@/components/layout/DashboardWrapper";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";

export default function ReportsPage() {
  return (
    <DashboardWrapper>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold">Report</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Report e analisi del budget marketing.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Disponibili</CardTitle>
            <CardDescription>Visualizza e genera report sul budget e le campagne.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
              Funzionalità in sviluppo. Presto sarà possibile generare e visualizzare report da qui.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
}

