import { DashboardWrapper } from "@/components/layout/DashboardWrapper";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";

export default function CampaignsPage() {
  return (
    <DashboardWrapper>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold">Campagne</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestione e monitoraggio delle campagne marketing.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista Campagne</CardTitle>
            <CardDescription>Visualizza e gestisci tutte le campagne attive.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
              Funzionalità in sviluppo. Presto sarà possibile visualizzare e gestire le campagne da qui.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
}

