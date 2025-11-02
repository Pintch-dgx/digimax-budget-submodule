import { SummaryCard } from "@/components/SummaryCard";
import { getDashboardData } from "@/lib/dashboard-service";
import { DashboardWrapper } from "@/components/layout/DashboardWrapper";
import { CampaignAllocationsTable } from "@/components/dashboard/CampaignAllocationsTable";
import { QuarterTimeline } from "@/components/dashboard/QuarterTimeline";
import { ApprovalsCard } from "@/components/dashboard/ApprovalsCard";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import Link from "next/link";

export default async function Home() {
  let dashboardData;
  try {
    dashboardData = await getDashboardData();
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    dashboardData = { summaryMetrics: [], campaignAllocations: [], upcomingApprovals: [], insights: [], quarterTimeline: [] };
  }

  const { summaryMetrics, campaignAllocations, upcomingApprovals, insights, quarterTimeline } = dashboardData;

  return (
    <DashboardWrapper>
      <div className="flex flex-col gap-8">
        {/* Header with action button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Budget Hub</h1>
            <p className="text-sm text-[var(--color-neutral-500)]">
              Controllo end-to-end del budget Digimax: visibilità, governance, insight.
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
          <h2
            id="budget-status-heading"
            className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]"
          >
            STATO BUDGET
          </h2>
          {summaryMetrics.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {summaryMetrics.map((metric) => (
                <SummaryCard key={metric.label} metric={metric} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-6 text-center text-[var(--color-neutral-500)]">
                <p>Nessun dato disponibile. Esegui il seed del database per vedere i dati di esempio.</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Main Content Grid */}
        <section className="flex flex-col gap-6" aria-label="Dashboard content">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(260px,1fr)_minmax(0,3fr)]">
            <ApprovalsCard approvals={upcomingApprovals} />

            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Timeline quarter sprint</CardTitle>
                <CardDescription>Visualizza l'obiettivo di ogni quarter in sequenza.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <QuarterTimeline quarters={quarterTimeline} />
              </CardContent>
            </Card>
          </div>

          <Card className="min-w-0 overflow-hidden">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Allocazione campagne</CardTitle>
                  <CardDescription>Allinea la spesa con le priorità strategiche.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" aria-label="Esporta allocazioni campagne" className="w-full sm:w-auto">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Esporta
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <CampaignAllocationsTable data={campaignAllocations} />
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardWrapper>
  );
}
