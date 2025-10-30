import type { SummaryMetric } from "@/lib/dashboard-service";

type SummaryCardProps = {
  metric: SummaryMetric;
};

const trendColors = {
  up: "text-emerald-600",
  down: "text-rose-600",
  flat: "text-slate-500",
} as const;

export function SummaryCard({ metric }: SummaryCardProps) {
  const formattedAmount = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(metric.amount);

  const formattedChange = `${metric.changePercentage > 0 ? "+" : ""}${metric.changePercentage.toFixed(1)}%`;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      <header className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">
        {metric.label}
      </header>
      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{formattedAmount}</p>
      <p className={`mt-1 text-sm font-medium ${trendColors[metric.trend]}`}>{formattedChange} vs target</p>
    </article>
  );
}
