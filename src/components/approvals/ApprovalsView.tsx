"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { ApprovalsList } from "./ApprovalsList";
import { FiscalYearBudgetStatus } from "./FiscalYearBudgetStatus";

export function ApprovalsView() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleChange = () => setRefreshKey((v) => v + 1);

  return (
    <div className="flex flex-col gap-6">
      <FiscalYearBudgetStatus refreshKey={refreshKey} />

      <Card className="border border-[var(--color-neutral-200)] bg-[var(--surface)] shadow-[var(--shadow-md)] dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]">
        <CardHeader>
          <CardTitle>Approvazioni in Attesa</CardTitle>
          <CardDescription>Richieste che necessitano della tua approvazione.</CardDescription>
        </CardHeader>
        <CardContent>
          <ApprovalsList onChange={handleChange} />
        </CardContent>
      </Card>
    </div>
  );
}
