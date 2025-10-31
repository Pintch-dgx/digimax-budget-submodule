import { SummaryCard } from "@/components/SummaryCard";
import { getDashboardData } from "@/lib/dashboard-service";
import { DashboardWrapper } from "@/components/layout/DashboardWrapper";
import { Button } from "@/components/ui";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui";
import Link from "next/link";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: value >= 100000 ? 0 : 2,
  }).format(value);
}

export default async function Home() {
  let dashboardData;
  try {
    dashboardData = await getDashboardData();
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    dashboardData = { summaryMetrics: [], campaignAllocations: [], upcomingApprovals: [], insights: [] };
  }

  const { summaryMetrics, campaignAllocations, upcomingApprovals, insights } = dashboardData;

  return (
    <DashboardWrapper>
      <div className="flex flex-col gap-8">
        {/* Header with action button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Marketing Budget Hub</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Controllo end-to-end del budget marketing Digimax: visibilità, governance, insight.
            </p>
          </div>
          <Link href="/budget-requests/new">
            <Button variant="primary" size="md" aria-label="Crea nuova richiesta budget">
              + Nuova Richiesta Budget
            </Button>
          </Link>
        </div>

        {/* Summary Metrics */}
        <section aria-labelledby="budget-status-heading">
          <h2 id="budget-status-heading" className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Stato budget FY24
          </h2>
          {summaryMetrics.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {summaryMetrics.map((metric) => (
                <SummaryCard key={metric.label} metric={metric} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-6 text-center text-slate-500 dark:text-slate-400">
                <p>Nessun dato disponibile. Esegui il seed del database per vedere i dati di esempio.</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Main Content Grid */}
        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]" aria-label="Dashboard content">
          {/* Campaign Allocations Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Allocazione campagne</CardTitle>
                  <CardDescription>Allinea la spesa con le priorità strategiche.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" aria-label="Esporta allocazioni campagne">
                  Esporta
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campagna</TableHead>
                    <TableHead>Canale</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Allocato</TableHead>
                    <TableHead className="text-right">Speso</TableHead>
                    <TableHead className="text-right">Delta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignAllocations.length > 0 ? (
                    campaignAllocations.map((campaign) => {
                      const delta = campaign.allocated - campaign.spent;
                      const deltaColor =
                        delta > 0 ? "text-emerald-600 dark:text-emerald-400" : delta < 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400";
                      return (
                        <TableRow key={campaign.name}>
                          <TableCell className="font-medium">{campaign.name}</TableCell>
                          <TableCell>{campaign.channel}</TableCell>
                          <TableCell>{campaign.owner}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(campaign.allocated)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(campaign.spent)}</TableCell>
                          <TableCell className={`text-right tabular-nums ${deltaColor}`}>{formatCurrency(delta)}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-slate-500 dark:text-slate-400 py-8">
                        Nessuna campagna disponibile
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Sidebar Cards */}
          <div className="flex flex-col gap-6">
            {/* Upcoming Approvals */}
            <Card>
              <CardHeader>
                <CardTitle>Approvazioni in arrivo</CardTitle>
                <CardDescription>Sblocca i budget critici prima delle deadline.</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingApprovals.length > 0 ? (
                  <ul className="space-y-4 text-sm" role="list">
                    {upcomingApprovals.map((approval) => (
                      <li key={approval.title} className="space-y-1 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                        <p className="font-medium">{approval.title}</p>
                        <p className="flex justify-between text-slate-500 dark:text-slate-400">
                          <span>Richiedente: {approval.requester}</span>
                          <span>{formatCurrency(approval.amount)}</span>
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Scadenza{" "}
                          <time dateTime={approval.dueDate}>
                            {new Date(approval.dueDate).toLocaleDateString("it-IT", { month: "short", day: "numeric" })}
                          </time>
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Nessuna approvazione in arrivo</p>
                )}
              </CardContent>
            </Card>

            {/* Operational Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Insight operativi</CardTitle>
                <CardDescription>Suggerimenti generati dai dati per ottimizzare il budget.</CardDescription>
              </CardHeader>
              <CardContent>
                {insights.length > 0 ? (
                  <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300" role="list">
                    {insights.map((insight) => (
                      <li key={insight.title}>
                        <p className="font-semibold text-slate-900 dark:text-slate-50">{insight.title}</p>
                        <p>{insight.description}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Nessuno insight disponibile</p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </DashboardWrapper>
  );
}
