import type { Metadata } from "next";
import { ReportsDashboard } from "@/components/reports/ReportsDashboard";
import { DashboardWrapper } from "@/components/layout/DashboardWrapper";

export const metadata: Metadata = {
  title: "Reportistica",
  description: "Report e KPI sulle richieste di budget e sulle campagne Digimax.",
};

export default function ReportsPage() {
  return (
    <DashboardWrapper>
      <ReportsDashboard />
    </DashboardWrapper>
  );
}

