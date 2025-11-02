"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  type BadgeProps,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
} from "@/components/ui";
import { BudgetRequestStatus } from "@prisma/client";

type FiscalYearOption = {
  id: number;
  code: string;
  label: string;
};

type ReportSummary = {
  totalRequests: number;
  totalAmountRequested: number;
  approvedCount: number;
  approvedAmount: number;
  pendingCount: number;
  rejectedCount: number;
  approvalRate: number;
};

type StatusBreakdown = {
  status: BudgetRequestStatus;
  requestCount: number;
  totalAmount: number;
};

type RequesterPerformance = {
  requesterId: number;
  fullName: string;
  email: string;
  requestCount: number;
  totalAmount: number;
};

type CampaignPerformance = {
  totals: {
    totalAllocated: number;
    totalSpent: number;
    totalRemaining: number;
  };
  topCampaigns: Array<{
    campaignId: number;
    campaignName: string;
    channel: string;
    owner: string;
    allocated: number;
    spent: number;
    remaining: number;
    status: string;
    goal: string | null;
    quarterSprint: {
      name: string;
      code: string | null;
      shortCode: string | null;
      objective: string;
      startDate: string | null;
      endDate: string | null;
    } | null;
  }>;
};

type ReportResponse = {
  summary: ReportSummary;
  requestsByStatus: StatusBreakdown[];
  topRequesters: RequesterPerformance[];
  campaignPerformance: CampaignPerformance;
};

const STATUS_LABELS: Record<BudgetRequestStatus, string> = {
  [BudgetRequestStatus.DRAFT]: "Bozze",
  [BudgetRequestStatus.PENDING_APPROVAL]: "In approvazione",
  [BudgetRequestStatus.APPROVED]: "Approvate",
  [BudgetRequestStatus.REJECTED]: "Rifiutate",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`;
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

function formatCampaignStatus(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getCampaignStatusVariant(value: string): BadgeProps["variant"] {
  const normalized = value.toLowerCase();
  if (normalized.includes("active")) return "success";
  if (normalized.includes("pending") || normalized.includes("planned")) return "warning";
  if (normalized.includes("paused") || normalized.includes("hold")) return "info";
  if (normalized.includes("archived") || normalized.includes("stopped") || normalized.includes("cancel")) return "danger";
  if (normalized.includes("completed") || normalized.includes("done")) return "default";
  return "default";
}

export function ReportsDashboard() {
  const { toast } = useToast();

  const [fiscalYears, setFiscalYears] = useState<FiscalYearOption[]>([]);
  const [fiscalYearId, setFiscalYearId] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [data, setData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const fetchFiscalYears = useCallback(async () => {
    try {
      const response = await fetch("/api/fiscal-years", { credentials: "include", cache: "no-store" });
      if (!response.ok) {
        throw new Error("Impossibile caricare gli anni fiscali");
      }
      const years: FiscalYearOption[] = await response.json();
      setFiscalYears(years);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore nel caricamento degli anni fiscali";
      toast({ variant: "error", title: "Errore", description: message });
    }
  }, [toast]);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (fiscalYearId !== "all") {
        params.set("fiscalYearId", fiscalYearId);
      }
      if (startDate) {
        params.set("startDate", startDate);
      }
      if (endDate) {
        params.set("endDate", endDate);
      }

      const query = params.toString();
      const url = query ? `/api/reports/overview?${query}` : "/api/reports/overview";

      const response = await fetch(url, { credentials: "include", cache: "no-store" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Errore sconosciuto" }));
        throw new Error(errorData.error || errorData.details || "Impossibile caricare i report");
      }

      const payload = (await response.json()) as { data: ReportResponse };
      setData(payload.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Si è verificato un errore";
      setError(message);
      toast({ variant: "error", title: "Errore report", description: message });
    } finally {
      setLoading(false);
    }
  }, [endDate, fiscalYearId, startDate, toast]);

  useEffect(() => {
    fetchFiscalYears();
  }, [fetchFiscalYears]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const approvalRateBadgeVariant = useMemo(() => {
    if (!data) {
      return "default" as const;
    }
    const rate = data.summary.approvalRate;
    if (rate >= 75) return "success" as const;
    if (rate >= 45) return "warning" as const;
    return "danger" as const;
  }, [data]);

  const campaignStatusGroups = useMemo(() => {
    if (!data) return [] as Array<{ status: string; label: string; variant: BadgeProps["variant"]; campaigns: CampaignPerformance["topCampaigns"] }>;
    const groups = new Map<string, { status: string; label: string; variant: BadgeProps["variant"]; campaigns: CampaignPerformance["topCampaigns"] }>();

    data.campaignPerformance.topCampaigns.forEach((campaign) => {
      const key = (campaign.status || "unknown").toLowerCase();
      if (!groups.has(key)) {
        groups.set(key, {
          status: campaign.status,
          label: formatCampaignStatus(campaign.status || "Sconosciuto"),
          variant: getCampaignStatusVariant(campaign.status || ""),
          campaigns: [],
        });
      }
      groups.get(key)!.campaigns.push(campaign);
    });

    return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label, "it-IT"));
  }, [data]);

  const handleExport = useCallback(
    async (dataset: "status" | "requesters" | "campaigns") => {
      try {
        setExporting(dataset);
        const params = new URLSearchParams();
        if (fiscalYearId !== "all") {
          params.set("fiscalYearId", fiscalYearId);
        }
        if (startDate) {
          params.set("startDate", startDate);
        }
        if (endDate) {
          params.set("endDate", endDate);
        }
        params.set("format", "csv");
        params.set("dataset", dataset);

        const response = await fetch(`/api/reports/overview?${params.toString()}`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Impossibile esportare il report");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `report-${dataset}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        toast({ variant: "success", title: "Esportazione completata" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Errore durante l'esportazione";
        toast({ variant: "error", title: "Errore esportazione", description: message });
      } finally {
        setExporting(null);
      }
    },
    [endDate, fiscalYearId, startDate, toast]
  );

  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-[var(--color-neutral-200)] bg-[var(--surface)] shadow-[var(--shadow-md)] dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface)]/60">
        <CardHeader>
          <CardTitle>Reportistica</CardTitle>
          <CardDescription>Analizza l&apos;andamento delle richieste budget, dei richiedenti e delle campagne.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              value={fiscalYearId}
              onChange={(event) => setFiscalYearId(event.target.value)}
            >
              <option value="all">Tutti gli anni fiscali</option>
              {fiscalYears.map((fy) => (
                <option key={fy.id} value={fy.id.toString()}>
                  {fy.code} — {fy.label}
                </option>
              ))}
            </Select>
            <Input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
            />
            <Input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => { setStartDate(""); setEndDate(""); setFiscalYearId("all"); }}>
                Reimposta filtri
              </Button>
              <Button variant="primary" onClick={() => fetchReports()} disabled={loading}>
                Aggiorna
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("status")}
              disabled={exporting !== null}
            >
              Esporta stati
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("requesters")}
              disabled={exporting !== null}
            >
              Esporta richiedenti
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("campaigns")}
              disabled={exporting !== null}
            >
              Esporta campagne
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-[var(--radius-md)] bg-[#fbe2e0] p-4 text-sm text-[#b93c35] shadow-[var(--shadow-sm)] dark:bg-[#3b1414] dark:text-[#ffb3ac]">
          <div className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => fetchReports()}>
              Riprova
            </Button>
          </div>
        </div>
      )}

      <section className="grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={`summary-skeleton-${index}`}>
              <CardContent className="space-y-2 py-3 sm:space-y-3 sm:py-4 lg:py-6">
                <Skeleton className="h-3 w-20 sm:h-4 sm:w-24 lg:w-32" />
                <Skeleton className="h-6 w-16 sm:h-7 sm:w-20 lg:h-8 lg:w-24" />
              </CardContent>
            </Card>
          ))
        ) : data ? (
          <>
            <Card>
              <CardHeader className="p-3 sm:p-4 lg:p-6">
                <CardDescription className="text-xs sm:text-sm">Totale richieste</CardDescription>
                <CardTitle className="text-xl font-semibold sm:text-2xl lg:text-3xl">{data.summary.totalRequests}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="p-3 sm:p-4 lg:p-6">
                <CardDescription className="text-xs sm:text-sm">Importo richiesto</CardDescription>
                <CardTitle className="text-xl font-semibold sm:text-2xl lg:text-3xl">{formatCurrency(data.summary.totalAmountRequested)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="p-3 sm:p-4 lg:p-6">
                <CardDescription className="text-xs sm:text-sm">Importo approvato</CardDescription>
                <CardTitle className="text-xl font-semibold sm:text-2xl lg:text-3xl">{formatCurrency(data.summary.approvedAmount)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="space-y-2 p-3 sm:space-y-3 sm:p-4 lg:p-6">
                <CardDescription className="text-xs sm:text-sm">Tasso approvazione</CardDescription>
                <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <CardTitle className="text-xl font-semibold sm:text-2xl lg:text-3xl">{formatPercentage(data.summary.approvalRate)}</CardTitle>
                  <Badge variant={approvalRateBadgeVariant} className="text-[0.6rem] uppercase tracking-wide sm:text-xs">
                    {approvalRateBadgeVariant === "success"
                      ? "Solido"
                      : approvalRateBadgeVariant === "warning"
                        ? "Attenzione"
                        : approvalRateBadgeVariant === "danger"
                          ? "Critico"
                          : "N/A"}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          </>
        ) : null}
      </section>

      <section className="flex flex-col gap-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Prestazioni campagne</CardTitle>
            <CardDescription>Residuo budget e prime campagne per spesa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading || !data ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="space-y-6">
                <div className="grid gap-2 lg:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                      Allocato
                    </p>
                    <p className="text-lg font-semibold text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]">
                      {formatCurrency(data.campaignPerformance.totals.totalAllocated)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                      Speso
                    </p>
                    <p className="text-lg font-semibold text-[#1f7b5c]">
                      {formatCurrency(data.campaignPerformance.totals.totalSpent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                      Residuo
                    </p>
                    <p className="text-lg font-semibold text-[#b93c35]">
                      {formatCurrency(data.campaignPerformance.totals.totalRemaining)}
                    </p>
                  </div>
                </div>
                <div className="space-y-5">
                  {campaignStatusGroups.length === 0 ? (
                    <p className="text-sm text-[var(--color-neutral-500)]">Nessuna campagna trovata.</p>
                  ) : (
                    <>
                      {campaignStatusGroups.map((group) => (
                        <div key={`campaign-group-${group.status}`} className="space-y-3">
                          <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-neutral-100)]/60 px-3 py-2 dark:bg-[var(--surface)]/60">
                            <div className="flex items-center gap-3">
                              <Badge variant={group.variant} className="uppercase">
                                {group.label}
                              </Badge>
                              <span className="text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                                {group.campaigns.length} campagne
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {group.campaigns.map((campaign) => {
                              const progress = campaign.allocated > 0 ? Math.round((campaign.spent / campaign.allocated) * 100) : null;
                              const progressBar = progress !== null ? Math.min(progress, 100) : 0;
                              const range = campaign.quarterSprint
                                ? formatDateRange(campaign.quarterSprint.startDate, campaign.quarterSprint.endDate)
                                : null;
                              return (
                                <div key={campaign.campaignId} className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)]/60 p-3 dark:border-[var(--color-neutral-100)]/60 dark:bg-[var(--surface)]/40">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                      <p className="font-semibold text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]">{campaign.campaignName}</p>
                                      <p className="text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                                        {campaign.channel} · {campaign.owner}
                                      </p>
                                    </div>
                                    <Badge variant={group.variant}>{group.label}</Badge>
                                  </div>
                                  {campaign.quarterSprint ? (
                                    <div className="space-y-1 text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="info" className="uppercase">Objective</Badge>
                                        <span className="font-semibold text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]">
                                          {(campaign.quarterSprint.shortCode ?? campaign.quarterSprint.code)
                                            ? `${campaign.quarterSprint.shortCode ?? campaign.quarterSprint.code} · ${campaign.quarterSprint.name}`
                                            : campaign.quarterSprint.name}
                                        </span>
                                      </div>
                                      <p className="max-w-xl text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                                        {campaign.quarterSprint.objective?.title ?? "Nessun obiettivo associato"}
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
                                  <div className="flex flex-wrap items-baseline gap-4 text-sm">
                                    <span className="text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                                      Allocato: <strong className="text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]">{formatCurrency(campaign.allocated)}</strong>
                                    </span>
                                    <span className="text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                                      Speso: <strong className="text-[#1f7b5c]">{formatCurrency(campaign.spent)}</strong>
                                    </span>
                                    <span className="text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                                      Residuo: <strong className="text-[#b93c35]">{formatCurrency(campaign.remaining)}</strong>
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                                      <Badge variant={progress !== null && progress > 100 ? "warning" : "success"} className="uppercase">KR</Badge>
                                      <span>{progress !== null ? `${progress}%` : "N/A"}</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-neutral-200)]/50 dark:bg-[var(--color-neutral-200)]/30">
                                      <div
                                        className="h-full rounded-full bg-[var(--color-secondary-cerulean)]"
                                        style={{ width: `${progressBar}%` }}
                                      />
                                    </div>
                                    <p className="text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                                      {campaign.goal ?? "—"}
                                    </p>
                                  </div>
                                </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Richieste per stato</CardTitle>
            <CardDescription>Distribuzione delle richieste e degli importi per ciascuno stato.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`status-skeleton-${index}`} className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : data ? (
              <div className="space-y-4">
                {data.requestsByStatus.map((status) => {
                  const percentage = data.summary.totalAmountRequested
                    ? Math.round((status.totalAmount / data.summary.totalAmountRequested) * 100)
                    : 0;
                  return (
                    <div key={status.status} className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/80">
                        <span className="font-medium text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]">
                          {STATUS_LABELS[status.status as BudgetRequestStatus]}
                        </span>
                        <span>{formatCurrency(status.totalAmount)} · {status.requestCount} richieste</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-neutral-200)]/60 dark:bg-[var(--color-neutral-200)]/40">
                        <div
                          className="h-full rounded-full bg-[var(--color-secondary-industrial)]"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-neutral-500)]">Nessun dato disponibile.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Top richiedenti</CardTitle>
          <CardDescription>Volume richieste e importi approvati per i principali richiedenti.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Richiedente</TableHead>
                  <TableHead>Richieste</TableHead>
                  <TableHead>Importo totale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`requester-skeleton-${index}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : data ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Richiedente</TableHead>
                  <TableHead className="text-right">Richieste</TableHead>
                  <TableHead className="text-right">Importo totale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topRequesters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-sm text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/80">
                      Nessun richiedente da mostrare.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.topRequesters.map((requester) => (
                    <TableRow key={requester.requesterId}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]">{requester.fullName}</span>
                          <span className="text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">{requester.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{requester.requestCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(requester.totalAmount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-[var(--color-neutral-500)]">Nessun dato disponibile.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


