import { DashboardWrapper } from "@/components/layout/DashboardWrapper";
import { OkrSheetManager } from "@/components/okr/OkrSheetManager";

export default function OkrPlannerPage() {
  return (
    <DashboardWrapper>
      <OkrSheetManager />
    </DashboardWrapper>
  );
}

