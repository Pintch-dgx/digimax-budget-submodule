"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Skeleton } from "@/components/ui";

type BudgetStatus = {
  fiscalYear: { id: number; code: string; label: string; currency: string };
  totalBudget: number;
  allocated: number;
  spent: number;
  remaining: number;
  percentage: number;
};

function formatCurrency(value: number, currency = "EUR") {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function FiscalYearBudgetStatus({ refreshKey = 0 }: { refreshKey?: number }) {
  const [status, setStatus] = useState<BudgetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const fyRes = await fetch("/api/fiscal-years", { credentials: "include", cache: "no-store" });
        if (!fyRes.ok) throw new Error("Errore caricamento fiscal years");
        const years: Array<{ id: number }> = await fyRes.json();
        if (!years.length) throw new Error("Nessun fiscal year configurato");
        const target = years[0];
        const res = await fetch(`/api/fiscal-years/${target.id}/budget-status`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Errore caricamento stato budget");
        const data: BudgetStatus = await res.json();
        if (!cancelled) setStatus(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Errore");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (loading) {
    return (
      <Card className="border border-[var(--color-neutral-200)] bg-[var(--surface)] shadow-[var(--shadow-md)] dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]">
        <CardHeader>
          <CardTitle>Budget rimanente</CardTitle>
          <CardDescription>Caricamento...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !status) {
    return (
      <Card className="border border-rose-200 bg-rose-50 text-rose-800 shadow-[var(--shadow-md)] dark:border-rose-900 dark:bg-[#3b1414] dark:text-[#ffb3ac]">
        <CardHeader>
          <CardTitle>Budget rimanente</CardTitle>
          <CardDescription>Impossibile calcolare lo stato del budget.</CardDescription>
        </CardHeader>
        <CardContent>{error ?? "Errore sconosciuto"}</CardContent>
      </Card>
    );
  }

  const pct = Math.round(status.percentage);
  const barColor =
    pct >= 95
      ? "bg-rose-500"
      : pct >= 80
      ? "bg-amber-500"
      : "bg-emerald-500";

  const currency = status.fiscalYear.currency || "EUR";

  return (
    <Card className="border border-[var(--color-neutral-200)] bg-[var(--surface)] shadow-[var(--shadow-md)] dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]">
      <CardHeader>
        <CardTitle>
          Budget rimanente · {status.fiscalYear.code}
        </CardTitle>
        <CardDescription>
          Fonte di verita': <code>sum(Campaign.allocatedBudget)</code> sul fiscal year corrente.
          L&apos;approvazione e&apos; bloccata se si sfora il totale.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-[var(--color-neutral-500)]">Totale</div>
              <div className="text-xl font-semibold tabular-nums">
                {formatCurrency(status.totalBudget, currency)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-[var(--color-neutral-500)]">Allocato</div>
              <div className="text-xl font-semibold tabular-nums">
                {formatCurrency(status.allocated, currency)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-[var(--color-neutral-500)]">Rimanente</div>
              <div className="text-xl font-semibold tabular-nums">
                {formatCurrency(status.remaining, currency)}
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-200)]">
              <div
                className={`h-full ${barColor} transition-all`}
                style={{ width: `${Math.min(100, pct)}%` }}
                aria-label={`Budget allocato: ${pct}%`}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-[var(--color-neutral-500)]">
              <span>{pct}% allocato</span>
              <span>
                {formatCurrency(status.allocated, currency)} / {formatCurrency(status.totalBudget, currency)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
