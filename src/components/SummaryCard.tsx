import type { SummaryMetric } from "@/lib/dashboard-service";

type SummaryCardProps = {
  metric: SummaryMetric;
};

const trendColors = {
  up: "text-[#1f7b5c]",
  down: "text-[#b93c35]",
  flat: "text-[var(--color-neutral-500)]",
} as const;

export function SummaryCard({ metric }: SummaryCardProps) {
  const formattedAmount = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(metric.amount);

  const formattedChange = `${metric.changePercentage > 0 ? "+" : ""}${metric.changePercentage.toFixed(1)}%`;

  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface)] p-5 shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)] dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]">
      <header className="mb-2 text-sm font-medium uppercase tracking-wide text-[var(--color-neutral-500)]">
        {metric.label}
      </header>
      <p className="text-2xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-neutral-800)]">{formattedAmount}</p>
      <p className={`mt-1 text-sm font-semibold ${trendColors[metric.trend]}`}>{formattedChange} vs target</p>
    </article>
  );
}
