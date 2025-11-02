import { DashboardWrapper } from "@/components/layout/DashboardWrapper";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { CampaignsList } from "@/components/campaigns/CampaignsList";

export default function CampaignsPage() {
  return (
    <DashboardWrapper>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-neutral-900)]">Campagne</h1>
          <p className="text-sm text-[var(--color-neutral-500)]">
            Monitora gli OKR, aggiorna i key result e riallinea gli investimenti.
          </p>
        </div>

        <Card className="border border-[var(--color-neutral-200)] bg-[var(--surface)] shadow-[var(--shadow-md)] dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]">
          <CardContent>
            <CampaignsList />
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
}
