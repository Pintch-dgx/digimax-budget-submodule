"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Select,
  Button,
  Card,
  CardContent,
  Skeleton,
  useToast,
  Badge,
  Input,
  type BadgeProps,
} from "@/components/ui";
import { useColumnVisibility, type ColumnConfig } from "@/hooks/useColumnVisibility";
import { ColumnSelector } from "@/components/ui/ColumnSelector";
import { ColumnFilter, type ColumnFilter as ColumnFilterType } from "@/components/ui/ColumnFilter";
import { cn } from "@/lib/utils";

type Campaign = {
  id: number;
  name: string;
  goal: string | null;
  status: string;
  channel: {
    id: number;
    name: string;
    slug: string;
  };
  owner: {
    id: number;
    fullName: string;
    email: string;
  };
  allocations: Array<{
    id: number;
    allocated: number;
    spent: number;
    fiscalYear: {
      id: number;
      code: string;
    };
  }>;
  fiscalYear: {
    id: number;
    code: string;
    label: string;
  };
  objective: {
    id: number;
    title: string;
    description: string | null;
    status: string;
  } | null;
  keyResult: {
    id: number;
    title: string;
    metric: string;
    targetValue: number;
    progressValue: number | null;
    status: string;
    weight: number;
  } | null;
  createdAt: string;
  updatedAt: string;
};

type FiscalYearOption = {
  id: number;
  code: string;
  label: string;
};

type ViewMode = "okr" | "sheet";

type CampaignDraft = {
  goal: string;
  allocated: string;
  spent: string;
  dirty: boolean;
  saving: boolean;
};

const buildBaseDraft = (campaign: Campaign): CampaignDraft => {
  const allocation = campaign.allocations[0];
  return {
    goal: campaign.goal ?? "",
    allocated: (allocation?.allocated ?? 0).toString(),
    spent: (allocation?.spent ?? 0).toString(),
    dirty: false,
    saving: false,
  };
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCampaignStatus(value: string | null | undefined) {
  if (!value) return "Sconosciuto";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getCampaignStatusVariant(value: string | null | undefined): Parameters<typeof Badge>[0]["variant"] {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("active")) return "success";
  if (normalized.includes("pending") || normalized.includes("planned") || normalized.includes("draft")) return "warning";
  if (normalized.includes("paused") || normalized.includes("hold")) return "info";
  if (normalized.includes("archived") || normalized.includes("stopped") || normalized.includes("cancel")) return "danger";
  if (normalized.includes("completed") || normalized.includes("done")) return "default";
  return "default";
}

// Configurazione colonne per la modalità foglio
const SHEET_COLUMNS: ColumnConfig[] = [
  { id: "campaign", label: "Campagna", defaultVisible: true },
  { id: "owner", label: "Owner", defaultVisible: true },
  { id: "status", label: "Stato", defaultVisible: true },
  { id: "goal", label: "Key Result", defaultVisible: true },
  { id: "allocated", label: "Allocato", defaultVisible: true },
  { id: "spent", label: "Speso", defaultVisible: true },
  { id: "delta", label: "Delta", defaultVisible: true },
  { id: "progress", label: "Progress", defaultVisible: true },
  { id: "actions", label: "Azioni", defaultVisible: true },
];

// Configurazione filtri per le colonne
const COLUMN_FILTERS: Record<string, ColumnFilterType> = {
  campaign: { type: "text" },
  // owner: filtro dinamico generato dalle campagne
  status: {
    type: "select",
    options: [
      { value: "ACTIVE", label: "Attiva" },
      { value: "PAUSED", label: "In pausa" },
      { value: "COMPLETED", label: "Completata" },
      { value: "ARCHIVED", label: "Archiviata" },
    ],
  },
  goal: { type: "text" },
  allocated: { type: "number" },
  spent: { type: "number" },
  delta: { type: "number" },
  progress: { type: "number" },
};

export function CampaignsList() {
  const { data: session } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fiscalYears, setFiscalYears] = useState<FiscalYearOption[]>([]);
  const [fiscalYearId, setFiscalYearId] = useState<string>("all");
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("sheet");
  const [campaignDrafts, setCampaignDrafts] = useState<Record<number, CampaignDraft>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({});
  const { toast } = useToast();

  // Gestione visibilità colonne per la modalità foglio
  const {
    visibleColumns,
    visibleColumnsConfig,
    orderedColumns,
    reorderColumns,
    toggleColumn,
    resetToDefaults,
  } = useColumnVisibility("campaigns-sheet", SHEET_COLUMNS);

  const fetchFiscalYears = useCallback(async () => {
    try {
      const response = await fetch("/api/fiscal-years", { credentials: "include", cache: "no-store" });
      if (!response.ok) {
        throw new Error("Impossibile caricare gli anni fiscali");
      }
      const data: FiscalYearOption[] = await response.json();
      setFiscalYears(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore nel caricamento degli anni fiscali";
      toast({ variant: "error", title: "Errore", description: message });
    }
  }, [toast]);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (fiscalYearId !== "all") {
        params.set("fiscalYearId", fiscalYearId);
      }
      const url = params.size > 0 ? `/api/campaigns?${params.toString()}` : "/api/campaigns";
      const response = await fetch(url, {
        credentials: "include",
        cache: "no-store",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || errorData.details || "Failed to fetch campaigns");
      }
      
      const payload = await response.json();
      const campaignsData = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
      setCampaigns(campaignsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      toast({ variant: "error", title: "Errore caricamento", description: message });
    } finally {
      setLoading(false);
    }
  }, [fiscalYearId, toast]);

  useEffect(() => {
    setFiltersLoading(true);
    fetchFiscalYears().finally(() => setFiltersLoading(false));
  }, [fetchFiscalYears]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    setCampaignDrafts((prev) => {
      const next: Record<number, CampaignDraft> = {};
      campaigns.forEach((campaign) => {
        const baseDraft = buildBaseDraft(campaign);
        const existing = prev[campaign.id];
        if (existing && (existing.dirty || existing.saving)) {
          next[campaign.id] = existing;
        } else {
          next[campaign.id] = baseDraft;
        }
      });
      return next;
    });
  }, [campaigns]);

  const filtersDisabled = filtersLoading;

  const groupedCampaigns = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        objective: Campaign["objective"];
        campaigns: Campaign[];
        totals: { allocated: number; spent: number; delta: number };
      }
    >();

    campaigns.forEach((campaign) => {
      const key = campaign.objective?.id ? `obj-${campaign.objective.id}` : "unassigned";
      const existing = groups.get(key);
      const allocation = campaign.allocations[0];
      const allocated = allocation?.allocated ?? 0;
      const spent = allocation?.spent ?? 0;
      const delta = allocated - spent;

      if (existing) {
        existing.campaigns.push(campaign);
        existing.totals.allocated += allocated;
        existing.totals.spent += spent;
        existing.totals.delta += delta;
      } else {
        groups.set(key, {
          key,
          objective: campaign.objective,
          campaigns: [campaign],
          totals: { allocated, spent, delta },
        });
      }
    });

    const sorted = Array.from(groups.values()).sort((a, b) => {
      const aName = a.objective?.title ?? "Senza Obiettivo";
      const bName = b.objective?.title ?? "Senza Obiettivo";
      return aName.localeCompare(bName, "it-IT");
    });

    return sorted;
  }, [campaigns]);

  // Estrai lista unica di owner per il filtro (deve essere a livello componente, non dentro renderSheetView)
  const uniqueOwners = useMemo(() => {
    const ownerMap = new Map<number, { id: number; name: string; email: string }>();
    campaigns.forEach((campaign) => {
      if (!ownerMap.has(campaign.owner.id)) {
        ownerMap.set(campaign.owner.id, {
          id: campaign.owner.id,
          name: campaign.owner.fullName,
          email: campaign.owner.email,
        });
      }
    });
    return Array.from(ownerMap.values()).sort((a, b) => a.name.localeCompare(b.name, "it-IT"));
  }, [campaigns]);

  // Crea configurazione dinamica del filtro owner
  const ownerFilterConfig: ColumnFilterType = useMemo(
    () => ({
      type: "select",
      options: uniqueOwners.map((owner) => ({
        value: owner.id.toString(),
        label: `${owner.name} (${owner.email})`,
      })),
    }),
    [uniqueOwners]
  );

  useEffect(() => {
    setExpandedGroups((previous) => {
      const next: Record<string, boolean> = {};
      groupedCampaigns.forEach((group) => {
        next[group.key] = previous[group.key] ?? true;
      });
      return next;
    });
  }, [groupedCampaigns]);

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  }, []);

  const handleDraftChange = useCallback(
    (campaignId: number, field: "goal" | "allocated" | "spent", value: string) => {
      setCampaignDrafts((prev) => {
        const campaign = campaigns.find((item) => item.id === campaignId);
        if (!campaign) {
          return prev;
        }

        const existing = prev[campaignId] ?? buildBaseDraft(campaign);
        const updated: CampaignDraft = { ...existing, [field]: value };
        const base = buildBaseDraft(campaign);

        const isDirty =
          base.goal !== updated.goal ||
          base.allocated !== updated.allocated ||
          base.spent !== updated.spent;

        updated.dirty = isDirty;

        return {
          ...prev,
          [campaignId]: updated,
        };
      });
    },
    [campaigns]
  );

  const handleResetDraft = useCallback(
    (campaignId: number) => {
      const campaign = campaigns.find((item) => item.id === campaignId);
      if (!campaign) {
        return;
      }
      setCampaignDrafts((prev) => ({
        ...prev,
        [campaignId]: buildBaseDraft(campaign),
      }));
    },
    [campaigns]
  );

  const handleSave = useCallback(
    async (campaignId: number) => {
      const draft = campaignDrafts[campaignId];
      if (!draft) {
        toast({ variant: "error", title: "Nessuna modifica", description: "Aggiorna la pagina e riprova." });
        return;
      }

      const campaign = campaigns.find((item) => item.id === campaignId);
      if (!campaign) {
        toast({ variant: "error", title: "Campagna non trovata" });
        return;
      }

      const allocated = Number(draft.allocated);
      const spent = Number(draft.spent);

      if (!Number.isFinite(allocated) || !Number.isFinite(spent) || allocated < 0 || spent < 0) {
        toast({ variant: "error", title: "Valori non validi", description: "Allocato e Speso devono essere numeri positivi." });
        return;
      }

      setCampaignDrafts((prev) => ({
        ...prev,
        [campaignId]: prev[campaignId] ? { ...prev[campaignId], saving: true } : buildBaseDraft(campaign),
      }));

      try {
        const payload = {
          goal: draft.goal,
          allocation: {
            allocated,
            spent,
          },
        };

        const response = await fetch(`/api/campaigns/${campaignId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        let responseBody: any = null;
        try {
          responseBody = await response.json();
        } catch (parseError) {
          responseBody = null;
        }

        if (!response.ok || !responseBody) {
          const message = responseBody?.error || responseBody?.details || `HTTP ${response.status}`;
          throw new Error(message);
        }

        const updatedCampaign: Campaign = responseBody.data;

        setCampaigns((prev) =>
          prev.map((item) => (item.id === updatedCampaign.id ? updatedCampaign : item))
        );

        setCampaignDrafts((prev) => ({
          ...prev,
          [campaignId]: {
            goal: updatedCampaign.goal ?? "",
            allocated: (updatedCampaign.allocations[0]?.allocated ?? 0).toString(),
            spent: (updatedCampaign.allocations[0]?.spent ?? 0).toString(),
            dirty: false,
            saving: false,
          },
        }));

        toast({ variant: "success", title: "Campagna aggiornata" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Errore durante l'aggiornamento";
        toast({ variant: "error", title: "Aggiornamento fallito", description: message });
        setCampaignDrafts((prev) => {
          const existing = prev[campaignId];
          if (!existing) {
            return prev;
          }
          return {
            ...prev,
            [campaignId]: { ...existing, saving: false },
          };
        });
      }
    },
    [campaignDrafts, campaigns, toast]
  );

  const handleResetFilters = () => {
    setFiscalYearId("all");
  };

  const formatDate = (value: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateRange = (start: string | null, end: string | null) => {
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
  };

  const renderOkrView = () => (
    <div className="space-y-4">
      {groupedCampaigns.map((group) => {
        const isExpanded = expandedGroups[group.key];
        const deltaColor =
          group.totals.delta > 0
            ? "text-[#1f7b5c]"
            : group.totals.delta < 0
              ? "text-[#b93c35]"
              : "text-[var(--color-neutral-500)]";

        return (
          <Card
            key={group.key}
            className="border border-[var(--color-neutral-200)] bg-[var(--surface)] shadow-[var(--shadow-md)] dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]"
          >
            <button
              type="button"
              onClick={() => toggleGroup(group.key)}
              className="flex w-full items-start justify-between gap-6 px-6 py-5 text-left"
              aria-expanded={isExpanded}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="info" className="uppercase">Obiettivo</Badge>
                </div>
                <div className="text-xl font-semibold text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]">
                  {group.objective?.title ?? "Senza Obiettivo"}
                </div>
                <p className="max-w-2xl text-sm text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                  {group.objective?.description ?? "Nessuna descrizione disponibile."}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1 text-right">
                <span className="text-xs uppercase tracking-wide text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                  Allocato
                </span>
                <span className="text-base font-semibold text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]">
                  {formatCurrency(group.totals.allocated)}
                </span>
                <span className="text-xs uppercase tracking-wide text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                  Speso
                </span>
                <span className="text-base font-semibold text-[#1f7b5c]">
                  {formatCurrency(group.totals.spent)}
                </span>
                <span className={`text-sm font-medium ${deltaColor}`}>
                  Delta {formatCurrency(group.totals.delta)}
                </span>
              </div>

              <span
                className={`mt-1 text-sm text-[var(--color-neutral-500)] transition-transform dark:text-[var(--color-tertiary-ice)]/70 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              >
                ▾
              </span>
            </button>

            {isExpanded && (
              <div className="border-t border-[var(--color-neutral-200)] bg-[var(--surface)]/90 px-0 py-4 dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface)]/40">
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campagna</TableHead>
                        <TableHead className="max-w-[260px]">Key Result</TableHead>
                        <TableHead>Canale</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead className="text-right">Allocato</TableHead>
                        <TableHead className="text-right">Speso</TableHead>
                        <TableHead className="text-right">Delta</TableHead>
                        <TableHead className="text-right">Progress</TableHead>
                        <TableHead>Anno Fiscale</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.campaigns.map((campaign) => {
                        const allocation = campaign.allocations[0];
                        const allocated = allocation?.allocated ?? 0;
                        const spent = allocation?.spent ?? 0;
                        const delta = allocated - spent;
                        const progress = allocated > 0 ? Math.round((spent / allocated) * 100) : null;
                        const progressBar = progress !== null ? Math.min(progress, 100) : 0;
                        const rowDeltaColor =
                          delta > 0
                            ? "text-[#1f7b5c]"
                            : delta < 0
                              ? "text-[#b93c35]"
                              : "text-[var(--color-neutral-500)]";

                        return (
                          <TableRow key={campaign.id}>
                            <TableCell className="font-medium">{campaign.name}</TableCell>
                            <TableCell className="max-w-[260px] align-top">
                              {campaign.goal && campaign.goal !== "—" ? (
                                <div className="group relative">
                                  <div className="cursor-help truncate text-sm text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                                    {campaign.goal}
                                  </div>
                                  <div className="pointer-events-none absolute bottom-full left-0 z-[9999] mb-2 hidden w-[400px] rounded-lg border border-[var(--color-neutral-200)] bg-[var(--surface)] p-3 text-sm shadow-2xl group-hover:block dark:border-[var(--color-neutral-700)] dark:bg-[var(--surface-muted)]">
                                    <div className="text-[var(--color-neutral-700)] dark:text-[var(--color-neutral-300)]">
                                      {campaign.goal}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">—</div>
                              )}
                            </TableCell>
                            <TableCell>{campaign.channel.name}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{campaign.owner.fullName}</span>
                                <span className="text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                                  {campaign.owner.email}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-medium text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]">
                              {formatCurrency(allocated)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-[#1f7b5c]">
                              {formatCurrency(spent)}
                            </TableCell>
                            <TableCell className={`text-right tabular-nums ${rowDeltaColor}`}>
                              {formatCurrency(delta)}
                            </TableCell>
                            <TableCell className="min-w-[160px] text-right">
                              {progress !== null ? (
                                <div className="ml-auto w-full max-w-[160px]">
                                  <div className="flex items-center justify-end gap-2 text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                                    <Badge variant={progress > 100 ? "warning" : "success"} className="uppercase">KR</Badge>
                                    <span>{progress}%</span>
                                  </div>
                                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[var(--color-neutral-200)]/50 dark:bg-[var(--color-neutral-200)]/30">
                                    <div
                                      className={`h-full rounded-full ${progress > 100 ? "bg-[#b93c35]" : "bg-[var(--color-secondary-industrial)]"}`}
                                      style={{ width: `${progressBar}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/60">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>{campaign.fiscalYear.code}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );

  const renderSheetView = () => {
    // Flatten campaigns for sheet view - mostra tutte le campagne senza nesting
    const flatCampaigns = groupedCampaigns.flatMap((group) => group.campaigns);

    return (
      <div className="space-y-4">
        {/* Toolbar con pulsante colonne */}
        <div className="flex items-center justify-end gap-2">
          <ColumnSelector
            columns={SHEET_COLUMNS}
            visibleColumns={visibleColumns}
            orderedColumns={orderedColumns}
            onToggleColumn={toggleColumn}
            onReorderColumns={reorderColumns}
            onReset={resetToDefaults}
            tableId="campaigns-sheet"
          />
        </div>

        <div className="w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface)] shadow-[var(--shadow-md)] dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]">
          <div className="w-full overflow-x-auto">
            <Table
              resizable
              minColumnWidth={12}
              className="min-w-[1200px]"
              tableId="campaigns-list"
              userId={session?.user?.id}
            >
              <TableHeader>
                <TableRow>
                  {visibleColumnsConfig.map((col) => {
                    // Usa configurazione dinamica per owner, altrimenti usa quella statica
                    const filter =
                      col.id === "owner" ? ownerFilterConfig : COLUMN_FILTERS[col.id];
                    const filterValue = columnFilters[col.id];
                    const isRightAligned = col.id === "allocated" || col.id === "spent" || col.id === "delta" || col.id === "progress" || col.id === "actions";
                    
                    return (
                      <TableHead
                        key={col.id}
                        className={isRightAligned ? "text-right" : ""}
                      >
                        <div className={cn("flex items-center", isRightAligned && "justify-end", !isRightAligned && "justify-between")}>
                          <span>{col.label}</span>
                          {filter && (
                            <ColumnFilter
                              columnId={col.id}
                              label={col.label}
                              filter={filter}
                              value={filterValue}
                              onChange={(value) => setColumnFilters((prev) => ({ ...prev, [col.id]: value }))}
                              onClear={() => {
                                setColumnFilters((prev) => {
                                  const updated = { ...prev };
                                  delete updated[col.id];
                                  return updated;
                                });
                              }}
                            />
                          )}
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
            <TableBody>
              {flatCampaigns
                .filter((campaign) => {
                  // Applica filtri colonna
                  for (const [columnId, filterValue] of Object.entries(columnFilters)) {
                    if (filterValue === null || filterValue === undefined || filterValue === "") continue;

                    if (columnId === "campaign") {
                      const filter = filterValue as { operator: string; value: string };
                      const campaignName = campaign.name.toLowerCase();
                      const searchValue = filter.value.toLowerCase();
                      if (filter.operator === "contains" && !campaignName.includes(searchValue)) return false;
                      if (filter.operator === "equals" && campaignName !== searchValue) return false;
                      if (filter.operator === "startsWith" && !campaignName.startsWith(searchValue)) return false;
                      if (filter.operator === "endsWith" && !campaignName.endsWith(searchValue)) return false;
                    }

                    if (columnId === "owner") {
                      const ownerId = filterValue as string;
                      if (campaign.owner.id.toString() !== ownerId) return false;
                    }

                    if (columnId === "status") {
                      const status = filterValue as string;
                      if (campaign.status !== status) return false;
                    }

                    if (columnId === "goal") {
                      const filter = filterValue as { operator: string; value: string };
                      const goalText = (campaign.goal ?? "").toLowerCase();
                      const searchValue = filter.value.toLowerCase();
                      if (filter.operator === "contains" && !goalText.includes(searchValue)) return false;
                      if (filter.operator === "equals" && goalText !== searchValue) return false;
                      if (filter.operator === "startsWith" && !goalText.startsWith(searchValue)) return false;
                      if (filter.operator === "endsWith" && !goalText.endsWith(searchValue)) return false;
                    }

                    if (columnId === "allocated" || columnId === "spent" || columnId === "delta" || columnId === "progress") {
                      const filter = filterValue as { operator: string; value: number };
                      const allocation = campaign.allocations[0];
                      let value: number;
                      if (columnId === "allocated") {
                        value = allocation?.allocated ?? 0;
                      } else if (columnId === "spent") {
                        value = allocation?.spent ?? 0;
                      } else if (columnId === "delta") {
                        value = (allocation?.allocated ?? 0) - (allocation?.spent ?? 0);
                      } else {
                        // progress
                        const allocated = allocation?.allocated ?? 0;
                        value = allocated > 0 ? Math.round(((allocation?.spent ?? 0) / allocated) * 100) : 0;
                      }

                      if (filter.operator === "equals" && value !== filter.value) return false;
                      if (filter.operator === "greaterThan" && value <= filter.value) return false;
                      if (filter.operator === "lessThan" && value >= filter.value) return false;
                      if (filter.operator === "greaterThanOrEqual" && value < filter.value) return false;
                      if (filter.operator === "lessThanOrEqual" && value > filter.value) return false;
                    }
                  }
                  return true;
                })
                .map((campaign, index) => {
                  const draft = campaignDrafts[campaign.id] ?? buildBaseDraft(campaign);
                  const allocatedValue = Number(draft.allocated || 0);
                  const spentValue = Number(draft.spent || 0);
                  const deltaValue = allocatedValue - spentValue;
                  const deltaClass =
                    deltaValue > 0
                      ? "text-[#1f7b5c]"
                      : deltaValue < 0
                        ? "text-[#b93c35]"
                        : "text-[var(--color-neutral-500)]";
                  const progress = allocatedValue > 0 ? Math.round((spentValue / allocatedValue) * 100) : null;
                  const progressBar = progress !== null ? Math.min(progress, 100) : 0;
                  const progressBadgeVariant: BadgeProps["variant"] = progress !== null && progress > 100 ? "warning" : "success";
                  const progressTextClass = progress !== null && progress > 100 ? "text-[#b93c35]" : "";
                  const isDirty = draft.dirty;
                  const isSaving = draft.saving;

                  // Determina se questa è la prima campagna di un gruppo (per evidenziare visivamente)
                  const currentGroup = groupedCampaigns.find((g) => g.campaigns.some((c) => c.id === campaign.id));
                  const isFirstInGroup = currentGroup?.campaigns[0]?.id === campaign.id;

                  return (
                    <TableRow
                      key={campaign.id}
                      className={`
                        ${isDirty ? "bg-[var(--color-tertiary-ice)]/25 dark:bg-[var(--surface)]/25" : ""}
                        ${isFirstInGroup && index > 0 ? "border-t-2 border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-100)]" : ""}
                      `}
                    >
                    {visibleColumnsConfig.map((col) => {
                      if (col.id === "campaign") {
                        return (
                          <TableCell key={col.id} className="align-top">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]">
                                {campaign.name}
                              </span>
                              <span className="text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                                {campaign.fiscalYear.code}
                              </span>
                            </div>
                          </TableCell>
                        );
                      }
                      if (col.id === "owner") {
                        return (
                          <TableCell key={col.id} className="align-top">
                            <div className="flex flex-col">
                              <span>{campaign.owner.fullName}</span>
                              <span className="text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                                {campaign.owner.email}
                              </span>
                            </div>
                          </TableCell>
                        );
                      }
                      if (col.id === "status") {
                        return (
                          <TableCell key={col.id} className="align-top">
                            <Badge variant={getCampaignStatusVariant(campaign.status)}>{formatCampaignStatus(campaign.status)}</Badge>
                          </TableCell>
                        );
                      }
                      if (col.id === "goal") {
                        return (
                          <TableCell key={col.id} className="align-top">
                            <Input
                              value={draft.goal}
                              onChange={(event) => handleDraftChange(campaign.id, "goal", event.target.value)}
                              placeholder="Definisci il risultato chiave"
                              disabled={isSaving}
                            />
                          </TableCell>
                        );
                      }
                      if (col.id === "allocated") {
                        return (
                          <TableCell key={col.id} className="align-top">
                            <Input
                              type="number"
                              min={0}
                              step="1000"
                              value={draft.allocated}
                              onChange={(event) => handleDraftChange(campaign.id, "allocated", event.target.value)}
                              disabled={isSaving}
                              inputMode="numeric"
                              className="text-right tabular-nums"
                            />
                          </TableCell>
                        );
                      }
                      if (col.id === "spent") {
                        return (
                          <TableCell key={col.id} className="align-top">
                            <Input
                              type="number"
                              min={0}
                              step="1000"
                              value={draft.spent}
                              onChange={(event) => handleDraftChange(campaign.id, "spent", event.target.value)}
                              disabled={isSaving}
                              inputMode="numeric"
                              className="text-right tabular-nums"
                            />
                          </TableCell>
                        );
                      }
                      if (col.id === "delta") {
                        return (
                          <TableCell key={col.id} className={`text-right tabular-nums align-top font-medium ${deltaClass}`}>
                            {formatCurrency(deltaValue)}
                          </TableCell>
                        );
                      }
                      if (col.id === "progress") {
                        return (
                          <TableCell key={col.id} className="align-top">
                            {progress !== null ? (
                              <div className="ml-auto w-full max-w-[160px]">
                                <div className="flex items-center justify-end gap-2 text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                                  <Badge variant={progressBadgeVariant} className="uppercase">
                                    KR
                                  </Badge>
                                  <span className={`font-medium ${progressTextClass}`}>{progress}%</span>
                                </div>
                                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[var(--color-neutral-200)]/50 dark:bg-[var(--color-neutral-200)]/30">
                                  <div
                                    className={`h-full rounded-full ${progress !== null && progress > 100 ? "bg-[#b93c35]" : "bg-[var(--color-secondary-industrial)]"}`}
                                    style={{ width: `${progressBar}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/60">N/A</span>
                            )}
                          </TableCell>
                        );
                      }
                      if (col.id === "actions") {
                        return (
                          <TableCell key={col.id} className="align-top">
                            {isDirty && (
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="primary" onClick={() => handleSave(campaign.id)} disabled={isSaving}>
                                  {isSaving ? "Salvataggio..." : "Salva"}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleResetDraft(campaign.id)} disabled={isSaving}>
                                  Reset
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        );
                      }
                      return null;
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
  };

  const hasActiveFilters = fiscalYearId !== "all" || Object.keys(columnFilters).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Link href="/campaigns/new">
          <Button variant="primary" size="sm" className="text-sm">
            + Nuova Campagna
          </Button>
        </Link>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-shrink-0">
            <label className="mb-2 block text-xs font-medium text-[var(--color-neutral-600)] dark:text-[var(--color-neutral-400)]">
              Anno Fiscale
            </label>
            <Select value={fiscalYearId} onChange={(event) => setFiscalYearId(event.target.value)} disabled={filtersDisabled} className="min-w-[180px]">
              <option value="all">Tutti gli anni fiscali</option>
              {fiscalYears.map((year) => (
                <option key={year.id} value={year.id.toString()}>
                  {year.label}
                </option>
              ))}
            </Select>
          </div>
          {hasActiveFilters && (
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleResetFilters();
                  setColumnFilters({});
                }}
                disabled={filtersDisabled}
                className="text-xs text-[var(--color-neutral-500)] hover:text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]/70 dark:hover:text-[var(--color-tertiary-ice)]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Cancella filtri
              </Button>
            </div>
          )}
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === "okr" ? "sheet" : "okr")}
              className="text-xs text-[var(--color-neutral-500)] hover:text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]/70 dark:hover:text-[var(--color-tertiary-ice)]"
            >
              {viewMode === "okr" ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <path d="M3 3h18v18H3zM9 9h6v6H9z" />
                    <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
                  </svg>
                  Vista tabella
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  Vista OKR
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {loading && <Skeleton className="h-10" />}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (viewMode === "okr" ? renderOkrView() : renderSheetView())}
    </div>
  );
}
