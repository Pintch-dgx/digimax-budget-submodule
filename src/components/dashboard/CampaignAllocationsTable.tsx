"use client";

import { useSession } from "next-auth/react";
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { cn } from "@/lib/utils";

type CampaignAllocation = {
  name: string;
  channel: string;
  owner: string;
  goal: string | null;
  allocated: number;
  spent: number;
  quarterSprint: {
    name: string;
    code: string | null;
    shortCode?: string | null;
    objective: string;
    startDate: string | null;
    endDate: string | null;
  } | null;
};

type CampaignAllocationsTableProps = {
  data: CampaignAllocation[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateRange(start: string | null, end: string | null) {
  const formattedStart = formatDate(start);
  const formattedEnd = formatDate(end);
  if (formattedStart && formattedEnd) {
    return `${formattedStart} → ${formattedEnd}`;
  }
  if (formattedStart) {
    return `Da ${formattedStart}`;
  }
  if (formattedEnd) {
    return `Fino a ${formattedEnd}`;
  }
  return null;
}

export function CampaignAllocationsTable({ data }: CampaignAllocationsTableProps) {
  const { data: session } = useSession();
  
  if (data.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface)]/80 py-8 text-center text-[var(--color-neutral-500)] shadow-[var(--shadow-md)] dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]">
        Nessuna campagna disponibile.
      </div>
    );
  }

  return (
    <div className="min-w-full">
      <Table resizable minColumnWidth={12} className="w-full" tableId="campaign-allocations" userId={session?.user?.id}>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">Campagna</TableHead>
            <TableHead className="min-w-[180px]">Key Result</TableHead>
            <TableHead className="min-w-[100px]">Canale</TableHead>
            <TableHead className="min-w-[120px]">Owner</TableHead>
            <TableHead className="min-w-[100px] text-right">Allocato</TableHead>
            <TableHead className="min-w-[100px] text-right">Speso</TableHead>
            <TableHead className="min-w-[100px] text-right">Delta</TableHead>
            <TableHead className="min-w-[140px] text-right">Progress</TableHead>
          </TableRow>
        </TableHeader>
      <TableBody>
        {data.map((allocation) => {
          const delta = allocation.allocated - allocation.spent;
          const deltaColor =
            delta > 0
              ? "text-[#1f7b5c]"
              : delta < 0
                ? "text-[#b93c35]"
                : "text-[var(--color-neutral-500)]";
          const progress = allocation.allocated > 0 ? Math.round((allocation.spent / allocation.allocated) * 100) : null;
          const progressBar = progress !== null ? Math.min(progress, 100) : 0;
          const quarterSprint = allocation.quarterSprint;
          const range = quarterSprint ? formatDateRange(quarterSprint.startDate, quarterSprint.endDate) : null;

          return (
            <TableRow key={allocation.name}>
              <TableCell className="align-top">
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]">
                    {allocation.name}
                  </span>
                  {quarterSprint ? (
                    <div className="space-y-1 text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                      <div className="flex items-center gap-2">
                        <Badge variant="info" className="uppercase">
                          Objective
                        </Badge>
                        <span className="font-semibold text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]">
                          {(quarterSprint.shortCode ?? quarterSprint.code)
                            ? `${quarterSprint.shortCode ?? quarterSprint.code} · ${quarterSprint.name}`
                            : quarterSprint.name}
                        </span>
                      </div>
                      <p className="max-w-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                        {quarterSprint.objective?.title ?? "Nessun obiettivo associato"}
                      </p>
                      {range && (
                        <span className="text-[var(--color-neutral-400)] dark:text-[var(--color-tertiary-ice)]/60">{range}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                      Nessun quarter sprint assegnato
                    </span>
                  )}
                </div>
              </TableCell>

              <TableCell className="align-top text-sm text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                {allocation.goal ?? "—"}
              </TableCell>

              <TableCell className="align-top">{allocation.channel}</TableCell>

              <TableCell className="align-top">
                <div className="flex flex-col">
                  <span>{allocation.owner}</span>
                </div>
              </TableCell>

              <TableCell className="align-top text-right tabular-nums font-medium text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]">
                {formatCurrency(allocation.allocated)}
              </TableCell>

              <TableCell className="align-top text-right tabular-nums text-[#1f7b5c]">
                {formatCurrency(allocation.spent)}
              </TableCell>

              <TableCell className={cn("align-top text-right tabular-nums", deltaColor)}>
                {formatCurrency(delta)}
              </TableCell>

              <TableCell className="align-top text-right">
                {progress !== null ? (
                  <div className="ml-auto w-full max-w-[180px]">
                    <div className="flex items-center justify-end gap-2 text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                      <Badge variant={progress > 100 ? "warning" : "success"} className="uppercase">
                        KR
                      </Badge>
                      <span>{progress}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[var(--color-neutral-200)]/50 dark:bg-[var(--color-neutral-200)]/30">
                      <div
                        className="h-full rounded-full bg-[var(--color-secondary-industrial)]"
                        style={{ width: `${progressBar}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/60">N/A</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
    </div>
  );
}


