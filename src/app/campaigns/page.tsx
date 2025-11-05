import { getServerSession } from "next-auth";
import { DashboardWrapper } from "@/components/layout/DashboardWrapper";
import { Card, CardContent } from "@/components/ui";
import { CampaignsList } from "@/components/campaigns/CampaignsList";
import { authOptions } from "@/lib/auth";
import { resolveUserRole } from "@/lib/role-guards";

export default async function CampaignsPage() {
  const session = await getServerSession(authOptions);
  const role = await resolveUserRole(session);
  const canCreateCampaign = role === "admin" || role === "MARKETING_MANAGER";
  const userId =
    typeof session?.user?.id === "string"
      ? session?.user?.id
      : session?.user?.id != null
        ? String(session?.user?.id)
        : null;

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
