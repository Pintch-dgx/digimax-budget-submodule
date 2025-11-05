"use client";

import { DashboardWrapper } from "@/components/layout/DashboardWrapper";
import { OkrSheetManager } from "@/components/okr/OkrSheetManager";

export default function OkrPage() {
  return (
    <DashboardWrapper>
      <OkrSheetManager />
    </DashboardWrapper>
  );
}
