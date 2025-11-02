"use client";

import { Fragment, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Input,
  Select,
  useToast,
  Tooltip,
} from "@/components/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { cn } from "@/lib/utils";
import type { FiscalYearOption } from "./OkrSheetTypes";
import { BadgePill } from "@/components/ui/BadgePill";
import { CreateObjectiveModal } from "./CreateObjectiveModal";
import { CreateQuarterSprintModal } from "./CreateQuarterSprintModal";
import { CreateKeyResultModal } from "./CreateKeyResultModal";

type SheetObjective = {
  id: string;
  title: string;
  description: string;
  status?: string; // ACTIVE, COMPLETED, ARCHIVED
  progress?: number | null;
  priority?: string; // Kept for UI compatibility but not sent to API
  goalType?: string; // Kept for UI compatibility but not sent to API
  fiscalYearId: string;
  expanded: boolean;
  dirty: boolean;
  saving: boolean;
  isNew?: boolean;
  isVirtual?: boolean;
  quarterSprints: SheetQuarterSprint[];
  orphanKeyResults: SheetKeyResult[];
};

type SheetQuarterSprint = {
  id: string;
  name: string;
  summary: string;
  code: string;
  shortCode: string;
  quarterNumber: string;
  startDate: string;
  endDate: string;
  fiscalYearId: string;
  objectiveId: string;
  expanded: boolean;
  dirty: boolean;
  saving: boolean;
  isNew?: boolean;
  keyResults: SheetKeyResult[];
};

type SheetKeyResult = {
  id: string;
  title: string;
  metric: string;
  targetValue: string;
  progressValue: string;
  unit: string;
  weight: string;
  quarterSprintId: string;
  objectiveId: string;
  dirty: boolean;
  saving: boolean;
  isNew?: boolean;
};

type FetchObjective = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  progress: number | null;
  fiscalYearId: number;
  createdAt: string;
  quarterSprints: Array<{
    id: number;
    name: string;
    code: string | null;
    shortCode: string | null;
    objectiveSummary: string | null;
    quarter: number | null;
    startDate: string | null;
    endDate: string | null;
    fiscalYearId: number | null;
    objectiveId: number | null;
    keyResults: Array<{
      id: number;
      title: string;
      metric: string;
      targetValue: number | null;
      progressValue: number | null;
      unit: string | null;
      weight: number | null;
      quarterSprintId: number | null;
    }>;
  }>;
};

type FetchQuarter = {
  id: number;
  name: string;
  code: string | null;
  shortCode: string | null;
  objectiveSummary: string | null;
  quarter: number | null;
  startDate: string | null;
  endDate: string | null;
  fiscalYearId: number | null;
  objectiveId: number | null;
  objective?: {
    id: number;
    title: string;
    description: string | null;
    status: string;
  } | null;
  counts?: {
    campaigns: number;
    keyResults: number;
    budgetRequests: number;
  };
};

type FetchKeyResult = FetchObjective["quarterSprints"][number]["keyResults"][number];

const GOAL_TYPE_OPTIONS = [
  { value: "qualitative", label: "Qualitativo" },
  { value: "quantitative", label: "Quantitativo" },
  { value: "mixed", label: "Misto" },
];

const getQuarterFromDate = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.floor(parsed.getMonth() / 3) + 1;
};

const toQuarterString = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === "") return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return String(Math.min(4, Math.max(1, numeric)));
};

const iconClasses = "h-4 w-4";

const SaveIcon = () => (
  <svg className={iconClasses} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
    <path d="M4 4.5a1.5 1.5 0 0 1 1.5-1.5h6.879a1.5 1.5 0 0 1 1.06.44l2.621 2.621a1.5 1.5 0 0 1 .44 1.06V15.5A1.5 1.5 0 0 1 15 17H5.5A1.5 1.5 0 0 1 4 15.5V4.5Z" />
    <path d="M7 3v4h6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m7.5 11 2 2 3-3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ResetIcon = () => (
  <svg className={iconClasses} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
    <path d="M6.5 6.5 4 4v5h5L6.9 6.9A5.5 5.5 0 1 1 4.5 10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AddIcon = () => (
  <svg className={iconClasses} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
    <path d="M10 4v12M4 10h12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type ActionItem = {
  label: string;
  description: string;
  icon: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  children?: ActionChild[];
};

type ActionChild = {
  label: string;
  description?: string;
  onSelect: () => void;
  disabled?: boolean;
};

interface ActionMenuProps {
  items: ActionItem[];
}

const ActionMenu = ({ items }: ActionMenuProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openIndex === null) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenIndex(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openIndex]);

  const handleSelect = (item: ActionItem, index: number) => {
    if (item.disabled) {
      return;
    }

    if (item.children && item.children.length > 0) {
      setOpenIndex((prev) => (prev === index ? null : index));
      return;
    }

    item.onSelect?.();
  };

  const handleChildSelect = (child: ActionChild) => {
    if (child.disabled) {
      return;
    }
    child.onSelect();
    setOpenIndex(null);
  };

  return (
    <div ref={containerRef} className="flex items-center justify-end gap-2">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div key={`${item.label}-${index}`} className="relative group">
            <button
              type="button"
              onClick={() => handleSelect(item, index)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md border border-transparent bg-transparent text-[var(--color-neutral-500)] transition-colors hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary-cerulean)] dark:text-[var(--color-tertiary-ice)]/80 dark:hover:bg-[var(--color-secondary-industrial)]/25",
                item.disabled && "cursor-not-allowed opacity-60 hover:bg-transparent hover:text-[var(--color-neutral-500)] dark:hover:bg-transparent"
              )}
              aria-label={item.label}
              aria-haspopup={item.children && item.children.length > 0 ? "menu" : undefined}
              aria-expanded={item.children && item.children.length > 0 ? isOpen : undefined}
              aria-disabled={item.disabled ? "true" : undefined}
            >
              {item.icon}
              <span className="sr-only">{item.label}</span>
            </button>

            <div className="pointer-events-none absolute bottom-full right-1/2 z-10 mb-2 w-48 translate-x-1/2 -translate-y-1 opacity-0 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
              <div className="rounded-md bg-[var(--color-primary)] px-3 py-2 text-xs text-white shadow-lg dark:bg-[var(--color-neutral-900)]">
                <p className="font-semibold leading-tight">{item.label}</p>
                <p className="mt-1 leading-snug opacity-80">{item.description}</p>
              </div>
            </div>

            {item.children && item.children.length > 0 && isOpen && (
              <div
                role="menu"
                aria-label={`${item.label} - opzioni`}
                className="absolute right-0 top-full z-20 mt-2 min-w-[200px] overflow-hidden rounded-lg border border-[var(--color-neutral-200)] bg-[var(--surface)] shadow-[var(--shadow-md)] dark:border-[var(--color-neutral-600)] dark:bg-[var(--surface-muted)]"
              >
                {item.children.map((child, childIndex) => (
                  <button
                    key={`${child.label}-${childIndex}`}
                    type="button"
                    role="menuitem"
                    className={cn(
                      "flex w-full flex-col items-start gap-1 px-4 py-2 text-left text-xs text-[var(--color-primary)] transition-colors hover:bg-[var(--color-neutral-100)] focus:outline-none dark:text-[var(--color-tertiary-ice)] dark:hover:bg-[var(--color-secondary-industrial)]/25",
                      child.disabled && "cursor-not-allowed opacity-50 hover:bg-transparent"
                    )}
                    onClick={() => handleChildSelect(child)}
                  >
                    <span className="font-semibold">{child.label}</span>
                    {child.description && <span className="text-[0.65rem] opacity-80">{child.description}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const newId = (() => {
  let counter = 0;
  return (prefix: string) => `${prefix}-tmp-${Date.now()}-${++counter}`;
})();

const toId = (value: number | string | null | undefined) => (value === null || value === undefined ? "" : String(value));

export function OkrSheetManager() {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [objectives, setObjectives] = useState<SheetObjective[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYearOption[]>([]);
  const [activeTab, setActiveTab] = useState<"objectives" | "quarters" | "keyresults">("objectives");
  const [objectiveFilter, setObjectiveFilter] = useState<"confirmed" | "draft">("confirmed");
  const [quarterFilter, setQuarterFilter] = useState<"confirmed" | "draft">("confirmed");
  const [keyResultFilter, setKeyResultFilter] = useState<"confirmed" | "draft">("confirmed");
  
  // Modal states
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
  const [isQuarterModalOpen, setIsQuarterModalOpen] = useState(false);
  const [isKeyResultModalOpen, setIsKeyResultModalOpen] = useState(false);

  const isAdmin = session?.user?.role === "admin";
  const currentUserId = session?.user?.id ? Number(session.user.id) : null;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [objectivesRes, quartersRes, fiscalYearsRes] = await Promise.all([
        fetch("/api/objectives", { credentials: "include", cache: "no-store" }),
        fetch("/api/quarter-sprints?withCounts=true", { credentials: "include", cache: "no-store" }),
        fetch("/api/fiscal-years", { credentials: "include", cache: "no-store" }),
      ]);

      if (!objectivesRes.ok) {
        const err = await objectivesRes.json().catch(() => ({}));
        throw new Error(err.error || "Impossibile caricare gli obiettivi");
      }
      if (!quartersRes.ok) {
        const err = await quartersRes.json().catch(() => ({}));
        throw new Error(err.error || "Impossibile caricare i quarter sprint");
      }
      if (!fiscalYearsRes.ok) {
        const err = await fiscalYearsRes.json().catch(() => ({}));
        throw new Error(err.error || "Impossibile caricare gli anni fiscali");
      }

      const objectivesPayload = await objectivesRes.json();
      const quartersPayload = await quartersRes.json();
      const fiscalYearsPayload = await fiscalYearsRes.json();

      const objectivesRaw: FetchObjective[] = objectivesPayload.data ?? objectivesPayload;
      const quartersRaw: FetchQuarter[] = (quartersPayload.data ?? quartersPayload) as FetchQuarter[];
      const fiscalYearsData: FiscalYearOption[] = fiscalYearsPayload.data ?? fiscalYearsPayload;
      
      console.log("[OkrSheetManager] Fiscal Years loaded:", fiscalYearsData);

      // Collect all keyResults from objectives' quarterSprints
      const allKeyResults: Array<{ quarterSprintId: number | null; [key: string]: any }> = [];
      objectivesRaw.forEach((objective) => {
        (objective.quarterSprints ?? []).forEach((qs: any) => {
          (qs.keyResults ?? []).forEach((kr: any) => {
            allKeyResults.push({
              ...kr,
              quarterSprintId: qs.id,
            });
          });
        });
      });

      const quarterMap = new Map<string, SheetQuarterSprint[]>();
      quartersRaw.forEach((quarter) => {
        const owner = toId(quarter.objectiveId) || "__unassigned__";
        if (!quarterMap.has(owner)) {
          quarterMap.set(owner, []);
        }
        
        // Find keyResults for this quarter sprint
        const quarterKeyResults = allKeyResults
          .filter((kr) => toId(kr.quarterSprintId) === toId(quarter.id))
          .map((kr) => ({
            id: toId(kr.id),
            title: kr.title ?? "",
            metric: kr.metric ?? "",
            targetValue: kr.targetValue !== null && kr.targetValue !== undefined ? String(kr.targetValue) : "",
            progressValue: kr.progressValue !== null && kr.progressValue !== undefined ? String(kr.progressValue) : "",
            unit: kr.unit ?? "unit",
            weight: toId(kr.weight) || "100",
            quarterSprintId: toId(quarter.id),
            objectiveId: toId(quarter.objectiveId),
            dirty: false,
            saving: false,
            isNew: false, // Existing key results from database
          }));

        quarterMap.get(owner)!.push({
          id: toId(quarter.id),
          name: quarter.name ?? "",
          summary: quarter.objectiveSummary ?? quarter.objective?.title ?? "",
          code: quarter.code ?? "",
          shortCode: quarter.shortCode ?? "",
          quarterNumber: toQuarterString(quarter.quarter ?? getQuarterFromDate(quarter.startDate?.slice?.(0, 10) ?? null)),
          startDate: quarter.startDate ? quarter.startDate.slice(0, 10) : "",
          endDate: quarter.endDate ? quarter.endDate.slice(0, 10) : "",
          fiscalYearId: toId(quarter.fiscalYearId),
          objectiveId: toId(quarter.objectiveId),
          expanded: true,
          dirty: false,
          saving: false,
          keyResults: quarterKeyResults,
        });
      });

      const objectiveStates: SheetObjective[] = objectivesRaw.map((objective) => {
        const objectiveId = toId(objective.id);
        const quartersForObjective = quarterMap.get(objectiveId) ?? [];
        
        // Collect orphan keyResults (keyResults without quarterSprintId or with invalid quarterSprintId)
        const orphanKeyResults: SheetKeyResult[] = allKeyResults
          .filter((kr) => {
            const krObjectiveId = toId(kr.quarterSprintId ? quartersRaw.find((q) => toId(q.id) === toId(kr.quarterSprintId))?.objectiveId : null);
            return krObjectiveId === objectiveId && (!kr.quarterSprintId || !quartersForObjective.some((qs) => toId(qs.id) === toId(kr.quarterSprintId)));
          })
          .map((kr) => ({
            id: toId(kr.id),
            title: kr.title ?? "",
            metric: kr.metric ?? "",
            targetValue: kr.targetValue !== null && kr.targetValue !== undefined ? String(kr.targetValue) : "",
            progressValue: kr.progressValue !== null && kr.progressValue !== undefined ? String(kr.progressValue) : "",
            unit: kr.unit ?? "unit",
            weight: toId(kr.weight) || "100",
            quarterSprintId: toId(kr.quarterSprintId),
            objectiveId: objectiveId,
            dirty: false,
            saving: false,
            isNew: false, // Existing key results are not new
          }));

        return {
          id: objectiveId,
          title: objective.title ?? "",
          description: objective.description ?? "",
          status: objective.status ?? "ACTIVE",
          progress: objective.progress ?? null,
          priority: "1", // Default priority (not in schema anymore, kept for UI)
          goalType: "qualitative", // Default goalType (not in schema anymore, kept for UI)
          fiscalYearId: toId(objective.fiscalYearId),
          expanded: true,
          dirty: false,
          saving: false,
          quarterSprints: quartersForObjective.map((qs) => ({ ...qs })),
          orphanKeyResults,
        };
      });

      const unassignedQuarterStates = quarterMap.get("__unassigned__") ?? [];
      if (unassignedQuarterStates.length > 0) {
        objectiveStates.push({
          id: "__virtual_unassigned__",
          title: "Quarter Sprint non assegnati",
          description: "Assegna questi sprint a un obiettivo nella colonna Contesto",
          priority: "",
          goalType: "",
          fiscalYearId: "",
          expanded: true,
          dirty: false,
          saving: false,
          isVirtual: true,
          quarterSprints: unassignedQuarterStates.map((qs) => ({ ...qs })),
          orphanKeyResults: [],
        });
      }

      setFiscalYears(fiscalYearsData);
      setObjectives(objectiveStates);
    } catch (error) {
      console.error("OKR fetch error", error);
      toast({ variant: "error", title: "Errore", description: error instanceof Error ? error.message : "Impossibile caricare i dati OKR" });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, toast]);

  useEffect(() => {
    if (status === "authenticated" && isAdmin) {
      fetchAll();
    }
  }, [status, isAdmin, fetchAll]);

  useEffect(() => {
    if (!fiscalYears.length) return;
    const defaultFiscalYear = String(fiscalYears[0]?.id ?? "");
    if (!defaultFiscalYear) return;

    setObjectives((prev) => {
      let changed = false;
      const next = prev.map((obj) => {
        if (obj.isVirtual || (obj.fiscalYearId && obj.fiscalYearId !== "")) {
          return obj;
        }
        changed = true;
        return {
          ...obj,
          fiscalYearId: defaultFiscalYear,
          dirty: obj.dirty || obj.isNew || false,
        };
      });
      return changed ? next : prev;
    });
  }, [fiscalYears]);

  const objectiveOptions = useMemo(() => 
    objectives
      .filter((obj) => !obj.isVirtual)
      .map((obj) => ({ 
        value: obj.id, 
        label: obj.title || (obj.isNew ? "(Nuovo obiettivo - non salvato)" : "(Senza titolo)") 
      })), 
    [objectives]
  );

  const quarterOptions = useMemo(() => {
    const options = objectives.flatMap((obj) => 
      obj.quarterSprints
        .filter((qs) => !qs.isNew || qs.name.trim() !== "") // Include new quarters if they have a name
        .map((qs) => ({ 
          value: qs.id, 
          label: qs.isNew ? `${qs.name || "Nuovo Quarter Sprint"} (da salvare)` : (qs.name || "Quarter Sprint")
        }))
    );
    // Don't add empty option - quarter sprint is required
    return options;
  }, [objectives]);

  // Extract flat lists for tabs
  const allQuarterSprints = useMemo(() => {
    return objectives.flatMap((obj) => 
      obj.quarterSprints.map((qs) => ({
        ...qs,
        objectiveId: qs.objectiveId || obj.id,
        objectiveTitle: obj.title,
      }))
    );
  }, [objectives]);

  const allKeyResults = useMemo(() => {
    const fromQuarters = objectives.flatMap((obj) =>
      obj.quarterSprints.flatMap((qs) =>
        qs.keyResults.map((kr) => ({
          ...kr,
          quarterSprintId: qs.id,
          quarterSprintName: qs.name,
          objectiveId: qs.objectiveId || obj.id,
          objectiveTitle: obj.title,
        }))
      )
    );
    const fromOrphans = objectives.flatMap((obj) =>
      obj.orphanKeyResults.map((kr) => ({
        ...kr,
        objectiveId: obj.id,
        objectiveTitle: obj.title,
      }))
    );
    return [...fromQuarters, ...fromOrphans];
  }, [objectives]);

  const fiscalYearOptions = useMemo(() => fiscalYears.map((fy) => ({ value: String(fy.id), label: fy.label || fy.code })), [fiscalYears]);

  const toggleObjective = (objectiveId: string) => {
    setObjectives((prev) => prev.map((obj) => (obj.id === objectiveId ? { ...obj, expanded: !obj.expanded } : obj)));
  };

  const toggleQuarter = (objectiveId: string, quarterId: string) => {
    setObjectives((prev) =>
      prev.map((obj) => {
        if (obj.id !== objectiveId) return obj;
        return {
          ...obj,
          quarterSprints: obj.quarterSprints.map((qs) => (qs.id === quarterId ? { ...qs, expanded: !qs.expanded } : qs)),
        };
      })
    );
  };

  const updateObjective = (objectiveId: string, updates: Partial<SheetObjective>) => {
    setObjectives((prev) =>
      prev.map((obj) => (obj.id === objectiveId ? { ...obj, ...updates, dirty: updates.dirty === undefined ? true : updates.dirty } : obj))
    );
  };

  const updateQuarter = (objectiveId: string, quarterId: string, updates: Partial<SheetQuarterSprint>) => {
    setObjectives((prev) => {
      // Check if objectiveId is being changed
      const isChangingObjective = updates.objectiveId !== undefined && updates.objectiveId !== objectiveId;
      
      if (isChangingObjective) {
        // Find the quarter sprint and move it to the new objective
        let quarterToMove: SheetQuarterSprint | null = null;
        
        const updatedObjectives = prev.map((obj) => {
          if (obj.id === objectiveId) {
            // Remove quarter from current objective
            const updatedQuarters = obj.quarterSprints.filter((qs) => qs.id !== quarterId);
            const foundQuarter = obj.quarterSprints.find((qs) => qs.id === quarterId);
            
            if (foundQuarter) {
              quarterToMove = { ...foundQuarter, ...updates, dirty: updates.dirty === undefined ? true : updates.dirty };
            }
            
            return { ...obj, quarterSprints: updatedQuarters };
          }
          return obj;
        });
        
        // Add quarter to new objective
        if (quarterToMove && updates.objectiveId) {
          return updatedObjectives.map((obj) => {
            if (obj.id === updates.objectiveId) {
              return {
                ...obj,
                quarterSprints: [...obj.quarterSprints, quarterToMove!],
              };
            }
            return obj;
          });
        }
        
        return updatedObjectives;
      }
      
      // Normal update within the same objective
      return prev.map((obj) => {
        if (obj.id !== objectiveId) return obj;
        return {
          ...obj,
          quarterSprints: obj.quarterSprints.map((qs) =>
            qs.id === quarterId ? { ...qs, ...updates, dirty: updates.dirty === undefined ? true : updates.dirty } : qs
          ),
        };
      });
    });
  };

  const updateKeyResult = (objectiveId: string, quarterId: string | null, keyResultId: string, updates: Partial<SheetKeyResult>) => {
    setObjectives((prev) =>
      prev.map((obj) => {
        if (obj.id !== objectiveId) return obj;

        if (quarterId) {
          return {
            ...obj,
            quarterSprints: obj.quarterSprints.map((qs) =>
              qs.id === quarterId
                ? {
                    ...qs,
                    keyResults: qs.keyResults.map((kr) =>
                      kr.id === keyResultId ? { ...kr, ...updates, dirty: updates.dirty === undefined ? true : updates.dirty } : kr
                    ),
                  }
                : qs
            ),
          };
        }

        return {
          ...obj,
          orphanKeyResults: obj.orphanKeyResults.map((kr) =>
            kr.id === keyResultId ? { ...kr, ...updates, dirty: updates.dirty === undefined ? true : updates.dirty } : kr
          ),
        };
      })
    );
  };

  // Modal handlers
  const handleCreateObjective = async (data: {
    title: string;
    description: string;
    fiscalYearId: number;
    status: string;
  }) => {
    try {
      const response = await fetch("/api/objectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          fiscalYearId: data.fiscalYearId,
          status: data.status,
          ownerId: currentUserId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create objective");
      }

      toast({ variant: "success", title: "Obiettivo creato", description: "L'obiettivo è stato creato con successo" });
      await fetchAll();
    } catch (error) {
      console.error("Error creating objective:", error);
      toast({ variant: "error", title: "Errore", description: "Impossibile creare l'obiettivo" });
      throw error;
    }
  };

  const handleCreateQuarterSprint = async (data: {
    name: string;
    objectiveSummary: string;
    objectiveId: number;
    startDate: string;
    endDate: string;
    fiscalYearId: number;
    quarter: number;
    code?: string;
    shortCode?: string;
  }) => {
    try {
      const response = await fetch("/api/quarter-sprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create quarter sprint");
      }

      toast({
        variant: "success",
        title: "Quarter Sprint creato",
        description: "Il Quarter Sprint è stato creato con successo",
      });
      await fetchAll();
    } catch (error) {
      console.error("Error creating quarter sprint:", error);
      toast({ variant: "error", title: "Errore", description: "Impossibile creare il Quarter Sprint" });
      throw error;
    }
  };

  const handleCreateKeyResult = async (data: {
    title: string;
    metric: string;
    quarterSprintId: number;
    targetValue: number;
    progressValue: number;
    weight: number;
    unit: string;
    ownerId: number | null;
  }) => {
    try {
      const response = await fetch("/api/key-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          metric: data.metric,
          quarterSprintId: data.quarterSprintId,
          targetValue: data.targetValue,
          progressValue: data.progressValue,
          weight: data.weight,
          unit: data.unit || "unit",
          ownerId: data.ownerId,
          status: "NOT_STARTED",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create key result");
      }

      toast({
        variant: "success",
        title: "Key Result creato",
        description: "Il Key Result è stato creato con successo",
      });
      await fetchAll();
    } catch (error) {
      console.error("Error creating key result:", error);
      toast({ variant: "error", title: "Errore", description: "Impossibile creare il Key Result" });
      throw error;
    }
  };

  const addObjective = () => {
    setIsObjectiveModalOpen(true);
  };

  const addQuarter = (objectiveId: string) => {
    setIsQuarterModalOpen(true);
  };

  const addKeyResult = (objectiveId: string, quarterId: string | null) => {
    setIsKeyResultModalOpen(true);
  };

  const handleResetObjective = (objective: SheetObjective) => {
    if (objective.isNew) {
      setObjectives((prev) => prev.filter((obj) => obj.id !== objective.id));
    } else {
      fetchAll();
    }
  };

  const handleResetQuarter = (objectiveId: string, quarter: SheetQuarterSprint) => {
    if (quarter.isNew) {
      setObjectives((prev) =>
        prev.map((obj) =>
          obj.id === objectiveId
            ? { ...obj, quarterSprints: obj.quarterSprints.filter((qs) => qs.id !== quarter.id) }
            : obj
        )
      );
    } else {
      fetchAll();
    }
  };

  const handleResetKeyResult = (objectiveId: string, quarterId: string | null, keyResult: SheetKeyResult) => {
    if (keyResult.isNew) {
      setObjectives((prev) =>
        prev.map((obj) => {
          if (obj.id !== objectiveId) return obj;
          if (quarterId) {
            return {
              ...obj,
              quarterSprints: obj.quarterSprints.map((qs) =>
                qs.id === quarterId ? { ...qs, keyResults: qs.keyResults.filter((kr) => kr.id !== keyResult.id) } : qs
              ),
            };
          }
          return {
            ...obj,
            orphanKeyResults: obj.orphanKeyResults.filter((kr) => kr.id !== keyResult.id),
          };
        })
      );
    } else {
      fetchAll();
    }
  };

  const deleteObjective = async (objective: SheetObjective) => {
    // Don't allow deletion of new/unsaved objectives
    if (objective.isNew) {
      toast({ variant: "info", title: "Impossibile eliminare", description: "Salva prima l'obiettivo per poterlo eliminare, oppure usa Reset per rimuoverlo." });
      return;
    }

    // Parse ID - handle both string and number IDs
    const objectiveIdStr = String(objective.id).trim();
    const objectiveIdNumber = parseInt(objectiveIdStr, 10);
    
    // Check if it's a temporary ID (contains "-tmp-" or starts with "obj")
    const isTemporaryId = objectiveIdStr.includes("-tmp-") || objectiveIdStr.startsWith("obj");
    
    // Debug logging
    console.log("deleteObjective - objective.id:", objective.id);
    console.log("deleteObjective - objectiveIdStr:", objectiveIdStr);
    console.log("deleteObjective - objectiveIdNumber:", objectiveIdNumber);
    console.log("deleteObjective - isTemporaryId:", isTemporaryId);
    console.log("deleteObjective - isFinite:", Number.isFinite(objectiveIdNumber));
    console.log("deleteObjective - isNaN:", isNaN(objectiveIdNumber));
    
    if (isTemporaryId || !Number.isFinite(objectiveIdNumber) || objectiveIdNumber <= 0 || isNaN(objectiveIdNumber)) {
      console.error("deleteObjective - ID validation failed", {
        objectiveIdStr,
        objectiveIdNumber,
        isTemporaryId,
        isFinite: Number.isFinite(objectiveIdNumber),
        isNaN: isNaN(objectiveIdNumber),
        isPositive: objectiveIdNumber > 0
      });
      toast({ variant: "warning", title: "ID non valido", description: `Impossibile eliminare un obiettivo non salvato. ID: ${objective.id}` });
      return;
    }

    if (!confirm(`Sei sicuro di voler eliminare l'obiettivo "${objective.title}"? Questa azione eliminerà anche tutti i Quarter Sprint e Key Results associati e non può essere annullata.`)) {
      return;
    }

    try {
      console.log("deleteObjective - Calling API with ID:", objectiveIdNumber);
      const response = await fetch(`/api/objectives/${objectiveIdNumber}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json().catch(() => ({}));
      
      console.log("deleteObjective - Response status:", response.status);
      console.log("deleteObjective - Response result:", result);
      
      if (!response.ok) {
        throw new Error(result.error || "Impossibile eliminare l'obiettivo");
      }

      toast({ variant: "success", title: "Obiettivo eliminato" });
      
      // Show info about deleted dependent items
      const deletedQuarters = result.deletedQuarterSprintsCount || 0;
      const deletedKeyResults = result.deletedKeyResultsCount || 0;
      
      if (deletedQuarters > 0 || deletedKeyResults > 0) {
        const parts: string[] = [];
        if (deletedQuarters > 0) parts.push(`${deletedQuarters} Quarter Sprint`);
        if (deletedKeyResults > 0) parts.push(`${deletedKeyResults} Key Result${deletedKeyResults > 1 ? 's' : ''}`);
        toast({ 
          variant: "info", 
          title: "Elementi collegati eliminati",
          description: `${parts.join(' e ')} eliminati automaticamente.`
        });
      }
      
      await fetchAll();
    } catch (error) {
      console.error("deleteObjective", error);
      toast({ variant: "error", title: "Errore", description: error instanceof Error ? error.message : "Eliminazione obiettivo non riuscita" });
    }
  };

  const deleteQuarter = async (objectiveId: string, quarter: SheetQuarterSprint) => {
    // Don't allow deletion of new/unsaved quarters
    if (quarter.isNew) {
      toast({ variant: "info", title: "Impossibile eliminare", description: "Salva prima il Quarter Sprint per poterlo eliminare, oppure usa Reset per rimuoverlo." });
      return;
    }

    // Parse ID - handle both string and number IDs
    const quarterIdStr = String(quarter.id).trim();
    const quarterIdNumber = parseInt(quarterIdStr, 10);
    
    // Check if it's a temporary ID (contains "-tmp-" or starts with "qs")
    const isTemporaryId = quarterIdStr.includes("-tmp-") || quarterIdStr.startsWith("qs");
    
    if (isTemporaryId || !Number.isFinite(quarterIdNumber) || quarterIdNumber <= 0 || isNaN(quarterIdNumber)) {
      toast({ variant: "warning", title: "ID non valido", description: "Impossibile eliminare un Quarter Sprint non salvato" });
      return;
    }

    if (!confirm(`Sei sicuro di voler eliminare il Quarter Sprint "${quarter.name}"? Questa azione eliminerà anche tutti i Key Results associati e non può essere annullata.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/quarter-sprints/${quarterIdNumber}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(result.error || "Impossibile eliminare il Quarter Sprint");
      }

      const deletedCount = result.deletedKeyResultsCount || 0;
      
      toast({ 
        variant: "success", 
        title: "Quarter Sprint eliminato",
        description: deletedCount > 0 ? `${deletedCount} Key Result${deletedCount > 1 ? 's' : ''} eliminato${deletedCount > 1 ? 'i' : ''} automaticamente.` : undefined
      });
      await fetchAll();
    } catch (error) {
      console.error("deleteQuarter", error);
      toast({ variant: "error", title: "Errore", description: error instanceof Error ? error.message : "Eliminazione Quarter Sprint non riuscita" });
    }
  };

  const deleteKeyResult = async (objectiveId: string, quarterId: string | null, keyResult: SheetKeyResult) => {
    // Don't allow deletion of new/unsaved key results
    if (keyResult.isNew) {
      toast({ variant: "info", title: "Impossibile eliminare", description: "Salva prima il Key Result per poterlo eliminare, oppure usa Reset per rimuoverlo." });
      return;
    }

    // Parse ID - handle both string and number IDs
    const keyResultIdStr = String(keyResult.id).trim();
    const keyResultIdNumber = parseInt(keyResultIdStr, 10);
    
    // Check if it's a temporary ID (contains "-tmp-" or starts with "kr")
    const isTemporaryId = keyResultIdStr.includes("-tmp-") || keyResultIdStr.startsWith("kr");
    
    if (isTemporaryId || !Number.isFinite(keyResultIdNumber) || keyResultIdNumber <= 0 || isNaN(keyResultIdNumber)) {
      toast({ variant: "warning", title: "ID non valido", description: "Impossibile eliminare un Key Result non salvato" });
      return;
    }

    if (!confirm(`Sei sicuro di voler eliminare il Key Result "${keyResult.title}"? Questa azione non può essere annullata.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/key-results/${keyResultIdNumber}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Impossibile eliminare il Key Result");
      }

      toast({ variant: "success", title: "Key Result eliminato" });
      await fetchAll();
    } catch (error) {
      console.error("deleteKeyResult", error);
      toast({ variant: "error", title: "Errore", description: error instanceof Error ? error.message : "Eliminazione Key Result non riuscita" });
    }
  };

  const saveObjective = async (objective: SheetObjective) => {
    if (!objective.title.trim()) {
      toast({ variant: "warning", title: "Titolo obbligatorio", description: "Imposta un titolo per l'obiettivo" });
      return;
    }

    // FiscalYearId is required for Objective
    if (!objective.fiscalYearId || objective.fiscalYearId === "") {
      toast({ variant: "warning", title: "Anno Fiscale obbligatorio", description: "Seleziona un anno fiscale per l'obiettivo" });
      return;
    }

    const parsedFiscalYearId = Number(objective.fiscalYearId);
    if (!Number.isFinite(parsedFiscalYearId) || parsedFiscalYearId <= 0) {
      toast({ variant: "error", title: "Anno Fiscale non valido", description: "Seleziona un anno fiscale valido" });
      return;
    }

    updateObjective(objective.id, { saving: true });

    try {
      if (objective.isNew) {
        const response = await fetch("/api/objectives", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: objective.title,
            description: objective.description,
            fiscalYearId: parsedFiscalYearId,
            status: "ACTIVE",
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || err.details || "Impossibile creare l'obiettivo");
        }
      } else {
        const response = await fetch(`/api/objectives/${objective.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: objective.title,
            description: objective.description,
            fiscalYearId: parsedFiscalYearId,
          }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || err.details || "Impossibile aggiornare l'obiettivo");
        }
      }

      toast({ variant: "success", title: "Obiettivo salvato" });
      await fetchAll();
    } catch (error) {
      console.error("saveObjective", error);
      toast({ variant: "error", title: "Errore", description: error instanceof Error ? error.message : "Salvataggio obiettivo non riuscito" });
      updateObjective(objective.id, { saving: false });
    }
  };

  const saveQuarter = async (objectiveId: string, quarter: SheetQuarterSprint) => {
    if (!quarter.name.trim()) {
      toast({ variant: "warning", title: "Nome quarter necessario", description: "Imposta un nome per il quarter sprint" });
      return;
    }

    // Use the quarter's objectiveId if it's set, otherwise use the current objectiveId
    const targetObjectiveId = quarter.objectiveId || objectiveId;
    const targetObjective = objectives.find((obj) => obj.id === targetObjectiveId);
    const quarterToSave = targetObjective?.quarterSprints.find((qs) => qs.id === quarter.id) || quarter;

    updateQuarter(targetObjectiveId, quarter.id, { saving: true });

    try {
      // Check if the objective is new (has temporary ID)
      const targetObjectiveForValidation = objectives.find((obj) => obj.id === targetObjectiveId);
      const isObjectiveNew = targetObjectiveForValidation?.isNew;
      
      if (isObjectiveNew && quarterToSave.isNew) {
        toast({ 
          variant: "info", 
          title: "Salva prima l'obiettivo", 
          description: "Devi salvare l'obiettivo prima di poter salvare il quarter sprint. Salva l'obiettivo e poi salva il quarter sprint." 
        });
        updateQuarter(targetObjectiveId, quarter.id, { saving: false });
        return;
      }

      if (!quarterToSave.objectiveId) {
        toast({ variant: "warning", title: "Obiettivo richiesto", description: "Seleziona il contesto a cui appartiene il quarter sprint" });
        updateQuarter(targetObjectiveId, quarter.id, { saving: false });
        return;
      }

      if (!quarterToSave.startDate || !quarterToSave.endDate) {
        toast({ variant: "warning", title: "Date mancanti", description: "Imposta sia la data di inizio che di fine" });
        updateQuarter(targetObjectiveId, quarter.id, { saving: false });
        return;
      }

      if (new Date(quarterToSave.startDate) > new Date(quarterToSave.endDate)) {
        toast({ variant: "warning", title: "Date non valide", description: "La data di inizio deve precedere la data di fine" });
        updateQuarter(targetObjectiveId, quarter.id, { saving: false });
        return;
      }

      const fiscalYearValue = quarterToSave.fiscalYearId || targetObjective?.fiscalYearId || "";

      if (!fiscalYearValue) {
        toast({ variant: "warning", title: "Fiscal year mancante", description: "Associa il quarter sprint a un anno fiscale" });
        updateQuarter(targetObjectiveId, quarter.id, { saving: false });
        return;
      }

      const parsedFiscalYearId = Number(fiscalYearValue);
      if (!Number.isFinite(parsedFiscalYearId)) {
        toast({ variant: "error", title: "Errore", description: "Fiscal year non valido" });
        updateQuarter(targetObjectiveId, quarter.id, { saving: false });
        return;
      }

      // Check if objectiveId is a valid number (not a temporary ID)
      const parsedObjectiveId = Number(quarterToSave.objectiveId);
      if (!Number.isFinite(parsedObjectiveId) || parsedObjectiveId <= 0) {
        toast({ 
          variant: "info", 
          title: "Salva prima l'obiettivo", 
          description: "L'obiettivo collegato non è ancora stato salvato. Salva prima l'obiettivo e poi salva il quarter sprint." 
        });
        updateQuarter(targetObjectiveId, quarter.id, { saving: false });
        return;
      }

      const computedQuarter = (() => {
        if (quarterToSave.quarterNumber) {
          const numeric = Number(quarterToSave.quarterNumber);
          if (Number.isFinite(numeric) && numeric >= 1 && numeric <= 4) {
            return numeric;
          }
        }
        const derived = getQuarterFromDate(quarterToSave.startDate);
        return derived ?? 1;
      })();

      const payload = {
        name: quarterToSave.name,
        code: quarterToSave.code || null,
        shortCode: quarterToSave.shortCode || null,
        objectiveSummary: quarterToSave.summary || null,
        quarter: computedQuarter,
        startDate: quarterToSave.startDate,
        endDate: quarterToSave.endDate,
        fiscalYearId: parsedFiscalYearId,
        objectiveId: parsedObjectiveId,
      };

      let response: Response;
      // Check if ID is a valid number (not a temporary ID like "qs-123")
      const quarterIdNumber = Number(quarterToSave.id);
      const isTemporaryId = typeof quarterToSave.id === "string" && (
        quarterToSave.id.startsWith("qs") || 
        quarterToSave.id.startsWith("obj") || 
        quarterToSave.id.startsWith("kr") ||
        quarterToSave.id.includes("-") // Also check for IDs like "qs-1234567890"
      );
      
      // Determine if we should use POST (new) or PATCH (existing)
      const shouldUsePost = quarterToSave.isNew || 
                           isTemporaryId || 
                           !Number.isFinite(quarterIdNumber) || 
                           quarterIdNumber <= 0 ||
                           isNaN(quarterIdNumber);
      
      if (shouldUsePost) {
        // It's a new quarter sprint, use POST
        response = await fetch("/api/quarter-sprints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      } else {
        // It's an existing quarter sprint, use PATCH - ensure ID is a valid number
        const validId = String(quarterIdNumber);
        response = await fetch(`/api/quarter-sprints/${validId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.details || "Impossibile salvare il quarter sprint");
      }

      toast({ variant: "success", title: "Quarter sprint salvato" });
      await fetchAll();
    } catch (error) {
      console.error("saveQuarter", error);
      toast({ variant: "error", title: "Errore", description: error instanceof Error ? error.message : "Salvataggio quarter sprint non riuscito" });
      updateQuarter(targetObjectiveId, quarter.id, { saving: false });
    }
  };

  const saveKeyResult = async (objectiveId: string, quarterId: string | null, keyResult: SheetKeyResult) => {
    if (!keyResult.title.trim() || !keyResult.metric.trim()) {
      toast({ variant: "warning", title: "Campi obbligatori", description: "Titolo e metrica sono obbligatori" });
      return;
    }

    updateKeyResult(objectiveId, quarterId, keyResult.id, { saving: true });

    try {
      // Validate quarterSprintId is required
      if (!keyResult.quarterSprintId || keyResult.quarterSprintId === "") {
        toast({ 
          variant: "warning", 
          title: "Quarter Sprint obbligatorio", 
          description: "Ogni Key Result deve essere associato a un Quarter Sprint. Seleziona un Quarter Sprint dalla lista oppure creane uno nuovo dal tab 'Quarter Sprint'." 
        });
        updateKeyResult(objectiveId, quarterId, keyResult.id, { saving: false });
        return;
      }

      const parsedQuarterSprintId = Number(keyResult.quarterSprintId);
      
      // Check if it's a temporary ID (starts with "qs" or "kr")
      const isTemporaryId = typeof keyResult.quarterSprintId === "string" && (keyResult.quarterSprintId.startsWith("qs") || keyResult.quarterSprintId.startsWith("kr"));
      
      if (isTemporaryId || !Number.isFinite(parsedQuarterSprintId) || parsedQuarterSprintId <= 0) {
        // Find the quarter sprint to check if it's saved
        const quarterSprint = objectives
          .flatMap((obj) => obj.quarterSprints)
          .find((qs) => qs.id === keyResult.quarterSprintId);
        
        if (quarterSprint?.isNew) {
          toast({ 
            variant: "info", 
            title: "Salva prima il Quarter Sprint", 
            description: "Il Quarter Sprint selezionato non è ancora stato salvato. Vai al tab 'Quarter Sprint', salva il Quarter Sprint, e poi torna qui per salvare il Key Result." 
          });
        } else {
          toast({ variant: "warning", title: "Quarter Sprint non valido", description: "Seleziona un Quarter Sprint valido e salvato" });
        }
        updateKeyResult(objectiveId, quarterId, keyResult.id, { saving: false });
        return;
      }

      // Parse targetValue and progressValue
      const parsedTargetValue = keyResult.targetValue && keyResult.targetValue.trim() !== "" ? Number(keyResult.targetValue) : null;
      const parsedProgressValue = keyResult.progressValue && keyResult.progressValue.trim() !== "" ? Number(keyResult.progressValue) : null;

      // targetValue is required and must be a positive number
      if (parsedTargetValue === null || Number.isNaN(parsedTargetValue)) {
        toast({ variant: "warning", title: "Target richiesto", description: "Inserisci un valore target numerico valido" });
        updateKeyResult(objectiveId, quarterId, keyResult.id, { saving: false });
        return;
      }

      if (parsedTargetValue < 0) {
        toast({ variant: "warning", title: "Target non valido", description: "Il target deve essere un numero positivo" });
        updateKeyResult(objectiveId, quarterId, keyResult.id, { saving: false });
        return;
      }

      if (parsedProgressValue !== null && Number.isNaN(parsedProgressValue)) {
        toast({ variant: "warning", title: "Progresso non valido", description: "Il progresso deve essere un numero" });
        updateKeyResult(objectiveId, quarterId, keyResult.id, { saving: false });
        return;
      }

      // Parse weight
      const parsedWeight = keyResult.weight && keyResult.weight.trim() !== "" ? Number(keyResult.weight) : 100;
      if (Number.isNaN(parsedWeight) || parsedWeight < 0) {
        toast({ variant: "warning", title: "Peso non valido", description: "Il peso deve essere un numero positivo" });
        updateKeyResult(objectiveId, quarterId, keyResult.id, { saving: false });
        return;
      }

      const payload = {
        title: keyResult.title,
        metric: keyResult.metric,
        targetValue: parsedTargetValue, // Required, non-null
        progressValue: parsedProgressValue,
        unit: keyResult.unit || "unit",
        weight: parsedWeight,
        quarterSprintId: parsedQuarterSprintId,
      };

      let response: Response;
      if (keyResult.isNew) {
        response = await fetch("/api/key-results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`/api/key-results/${keyResult.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.details || "Impossibile salvare il Key Result");
      }

      toast({ variant: "success", title: "Key Result salvato" });
      await fetchAll();
    } catch (error) {
      console.error("saveKeyResult", error);
      toast({ variant: "error", title: "Errore", description: error instanceof Error ? error.message : "Salvataggio Key Result non riuscito" });
      updateKeyResult(objectiveId, quarterId, keyResult.id, { saving: false });
    }
  };

  if (status === "loading") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Planner OKR</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-neutral-500)]">Caricamento in corso…</p>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accesso riservato</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-neutral-500)]">
            Solo gli utenti amministratori possono accedere al planner OKR.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Helper to find objective/quarter for updates
  const findObjectiveForQuarter = (quarterId: string): { objectiveId: string; quarter: SheetQuarterSprint | null } => {
    for (const obj of objectives) {
      const quarter = obj.quarterSprints.find((qs) => qs.id === quarterId);
      if (quarter) {
        return { objectiveId: obj.id, quarter };
      }
    }
    return { objectiveId: "", quarter: null };
  };

  const findObjectiveForKeyResult = (keyResultId: string): { objectiveId: string; quarterId: string | null; keyResult: SheetKeyResult | null } => {
    for (const obj of objectives) {
      // Check in quarter sprints
      for (const qs of obj.quarterSprints) {
        const kr = qs.keyResults.find((k) => k.id === keyResultId);
        if (kr) {
          return { objectiveId: obj.id, quarterId: qs.id, keyResult: kr };
        }
      }
      // Check in orphan key results
      const kr = obj.orphanKeyResults.find((k) => k.id === keyResultId);
      if (kr) {
        return { objectiveId: obj.id, quarterId: null, keyResult: kr };
      }
    }
    return { objectiveId: "", quarterId: null, keyResult: null };
  };

  return (
    <div className="space-y-6">
      <Card className="border border-[var(--color-neutral-200)] bg-[var(--surface)] shadow-[var(--shadow-md)] dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="inline-flex items-start gap-0.5">
              Planner OKR
              <Tooltip
                content={
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
                      Workflow Consigliato
                    </h3>
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      Segui questo ordine per creare un OKR completo:
                    </p>
                    <ol className="mt-2 space-y-1 text-xs text-blue-800 dark:text-blue-200">
                      <li><strong>1.</strong> Crea e salva un <strong>Obiettivo</strong></li>
                      <li><strong>2.</strong> Crea e salva un <strong>Quarter Sprint</strong> (collegato all'obiettivo)</li>
                      <li><strong>3.</strong> Crea e salva i <strong>Key Results</strong> (collegati al Quarter Sprint)</li>
                    </ol>
                    <p className="mt-2 text-xs italic text-blue-700 dark:text-blue-300">
                      💡 Ogni Key Result deve essere associato a un Quarter Sprint salvato.
                    </p>
                  </div>
                }
              >
                <button className="relative -top-1 inline-flex h-3.5 w-3.5 items-center justify-center text-blue-400 opacity-50 transition-opacity hover:opacity-100 dark:text-blue-500">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </Tooltip>
            </CardTitle>
            <p className="text-sm text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
              Gestisci obiettivi, quarter sprint e key result separatamente con lookup per creare le relazioni.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
              Aggiorna dati
            </Button>
            {activeTab === "objectives" && (
              <Button variant="primary" size="sm" onClick={addObjective}>
                + Nuovo obiettivo
              </Button>
            )}
            {activeTab === "quarters" && (
              <Button variant="primary" size="sm" onClick={() => {
                const defaultObj = objectives.find((o) => !o.isVirtual);
                if (defaultObj) addQuarter(defaultObj.id);
                else toast({ variant: "warning", title: "Crea prima un obiettivo", description: "Devi creare almeno un obiettivo prima di aggiungere quarter sprint." });
              }}>
                + Nuovo Quarter Sprint
              </Button>
            )}
            {activeTab === "keyresults" && (
              <Button variant="primary" size="sm" onClick={() => {
                const defaultObj = objectives.find((o) => !o.isVirtual);
                const hasQuarterSprints = objectives.some((obj) => obj.quarterSprints.length > 0);
                
                if (!defaultObj) {
                  toast({ variant: "warning", title: "Crea prima un obiettivo", description: "Devi creare e salvare almeno un obiettivo prima di aggiungere Key Results." });
                  return;
                }
                
                if (!hasQuarterSprints) {
                  toast({ 
                    variant: "info", 
                    title: "Crea prima un Quarter Sprint", 
                    description: "Per creare un Key Result, devi prima creare e salvare un Quarter Sprint. Vai al tab 'Quarter Sprint' per crearne uno." 
                  });
                  return;
                }
                
                addKeyResult(defaultObj.id, null);
              }}>
                + Nuovo Key Result
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value="objectives">Obiettivi</TabsTrigger>
              <TabsTrigger value="quarters">Quarter Sprint</TabsTrigger>
              <TabsTrigger value="keyresults">Key Results</TabsTrigger>
            </TabsList>

            <TabsContent value="objectives">
              <div className="mb-4 flex items-center justify-end gap-1">
                <Button
                  variant={objectiveFilter === "confirmed" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setObjectiveFilter("confirmed")}
                  className={`text-xs ${objectiveFilter === "confirmed" ? "" : "text-[var(--color-neutral-500)] hover:text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]/70 dark:hover:text-[var(--color-tertiary-ice)]"}`}
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
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  Confermati
                </Button>
                <Button
                  variant={objectiveFilter === "draft" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setObjectiveFilter("draft")}
                  className={`text-xs ${objectiveFilter === "draft" ? "" : "text-[var(--color-neutral-500)] hover:text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]/70 dark:hover:text-[var(--color-tertiary-ice)]"}`}
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
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  In attivazione
                </Button>
              </div>
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[1000px] text-[0.85rem]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titolo</TableHead>
                      <TableHead>Descrizione</TableHead>
                      <TableHead>Anno Fiscale</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Quarter Sprint</TableHead>
                      <TableHead>Key Results</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {objectives
                      .filter((o) => !o.isVirtual)
                      .filter((objective) => {
                        const hasKeyResults = objective.quarterSprints.some((qs) => qs.keyResults.length > 0);
                        const isConfirmed = objective.quarterSprints.length > 0 && hasKeyResults;
                        return objectiveFilter === "confirmed" ? isConfirmed : !isConfirmed;
                      })
                      .map((objective) => {
                      const quarterCount = objective.quarterSprints.length;
                      const keyResultCount = objective.quarterSprints.reduce((sum, qs) => sum + qs.keyResults.length, 0) + objective.orphanKeyResults.length;

                      return (
                        <TableRow key={objective.id} className="border-t">
                          <TableCell>
                            <Input
                              value={objective.title}
                              onChange={(event) => updateObjective(objective.id, { title: event.target.value })}
                              className="font-semibold"
                              placeholder="Titolo obiettivo"
                            />
                          </TableCell>
                          <TableCell>
                            <textarea
                              value={objective.description}
                              onChange={(event) => updateObjective(objective.id, { description: event.target.value })}
                              rows={2}
                              className="w-full resize-none border-b border-[var(--color-neutral-200)] bg-transparent px-0 py-2 text-sm text-[var(--color-primary)] focus:border-[var(--color-secondary-cerulean)] focus:outline-none dark:border-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]"
                              placeholder="Descrizione"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={String(objective.fiscalYearId || "")}
                              onChange={(event) =>
                                updateObjective(objective.id, { fiscalYearId: event.target.value })
                              }
                              disabled={loading}
                              className="w-full"
                            >
                              <option value="">Senza anno</option>
                              {fiscalYearOptions.map((fy) => (
                                <option key={fy.value} value={fy.value}>
                                  {fy.label}
                                </option>
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{objective.status || "ACTIVE"}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{objective.progress !== null ? `${objective.progress}%` : "-"}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{quarterCount} Quarter Sprint</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{keyResultCount} Key Results</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {objective.dirty && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="primary" 
                                    onClick={() => saveObjective(objective)} 
                                    disabled={objective.saving || !objective.dirty}
                                    className="hidden sm:inline-flex"
                                    title="Salva"
                                  >
                                    {objective.saving ? "Salvataggio..." : "Salva"}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="primary" 
                                    onClick={() => saveObjective(objective)} 
                                    disabled={objective.saving || !objective.dirty}
                                    className="sm:hidden"
                                    title="Salva"
                                  >
                                    {objective.saving ? (
                                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                      </svg>
                                    ) : (
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleResetObjective(objective)} 
                                    disabled={objective.saving}
                                    className="hidden sm:inline-flex"
                                    title="Reset"
                                  >
                                    Reset
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleResetObjective(objective)} 
                                    disabled={objective.saving}
                                    className="sm:hidden"
                                    title="Reset"
                                  >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                  </Button>
                                </>
                              )}
                              {!objective.isNew && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => deleteObjective(objective)} 
                                  disabled={objective.saving}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
                                  title="Elimina"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {objectives.filter((o) => !o.isVirtual).length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={8} className="py-12 text-center text-sm text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                          Nessun obiettivo ancora configurato. Clicca su "Nuovo obiettivo" per iniziare.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="quarters">
              <div className="mb-4 flex items-center justify-end gap-1">
                <Button
                  variant={quarterFilter === "confirmed" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setQuarterFilter("confirmed")}
                  className={`text-xs ${quarterFilter === "confirmed" ? "" : "text-[var(--color-neutral-500)] hover:text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]/70 dark:hover:text-[var(--color-tertiary-ice)]"}`}
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
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  Confermati
                </Button>
                <Button
                  variant={quarterFilter === "draft" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setQuarterFilter("draft")}
                  className={`text-xs ${quarterFilter === "draft" ? "" : "text-[var(--color-neutral-500)] hover:text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]/70 dark:hover:text-[var(--color-tertiary-ice)]"}`}
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
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  In attivazione
                </Button>
              </div>
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[1000px] text-[0.85rem]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Obiettivo (Lookup)</TableHead>
                      <TableHead>Inizio</TableHead>
                      <TableHead>Fine</TableHead>
                      <TableHead>Codice</TableHead>
                      <TableHead>Key Results</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allQuarterSprints
                      .filter((quarter) => {
                        const hasKeyResults = quarter.keyResults.length > 0;
                        return quarterFilter === "confirmed" ? hasKeyResults : !hasKeyResults;
                      })
                      .map((quarter) => {
                      const { objectiveId } = findObjectiveForQuarter(quarter.id);

                      return (
                        <TableRow key={quarter.id} className="border-t">
                          <TableCell>
                            <Input
                              value={quarter.name}
                              onChange={(event) => {
                                const { objectiveId: objId } = findObjectiveForQuarter(quarter.id);
                                updateQuarter(objId, quarter.id, { name: event.target.value });
                              }}
                              placeholder="Nome quarter sprint"
                            />
                          </TableCell>
                          <TableCell>
                            <textarea
                              value={quarter.summary}
                              onChange={(event) => {
                                const { objectiveId: objId } = findObjectiveForQuarter(quarter.id);
                                updateQuarter(objId, quarter.id, { summary: event.target.value });
                              }}
                              rows={2}
                              className="w-full resize-none border-b border-[var(--color-neutral-200)] bg-transparent px-0 py-2 text-sm text-[var(--color-primary)] focus:border-[var(--color-secondary-cerulean)] focus:outline-none dark:border-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]"
                              placeholder="Summary"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={quarter.objectiveId || ""}
                              onChange={(event) => {
                                const { objectiveId: objId } = findObjectiveForQuarter(quarter.id);
                                updateQuarter(objId, quarter.id, { objectiveId: event.target.value });
                              }}
                            >
                              <option value="">Senza obiettivo</option>
                              {objectiveOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={quarter.startDate || ""}
                              onChange={(event) => {
                                const { objectiveId: objId } = findObjectiveForQuarter(quarter.id);
                                const derived = getQuarterFromDate(event.target.value);
                                updateQuarter(objId, quarter.id, {
                                  startDate: event.target.value,
                                  quarterNumber: derived ? String(derived) : "",
                                });
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={quarter.endDate || ""}
                              onChange={(event) => {
                                const { objectiveId: objId } = findObjectiveForQuarter(quarter.id);
                                updateQuarter(objId, quarter.id, { endDate: event.target.value });
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={quarter.code}
                              onChange={(event) => {
                                const { objectiveId: objId } = findObjectiveForQuarter(quarter.id);
                                updateQuarter(objId, quarter.id, { code: event.target.value });
                              }}
                              placeholder="Codice"
                            />
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{quarter.keyResults.length} Key Results</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {quarter.dirty && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="primary" 
                                    onClick={() => {
                                      const { objectiveId: objId, quarter: q } = findObjectiveForQuarter(quarter.id);
                                      if (q) saveQuarter(objId, q);
                                    }} 
                                    disabled={quarter.saving || !quarter.dirty}
                                    className="hidden sm:inline-flex"
                                    title="Salva"
                                  >
                                    {quarter.saving ? "Salvataggio..." : "Salva"}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="primary" 
                                    onClick={() => {
                                      const { objectiveId: objId, quarter: q } = findObjectiveForQuarter(quarter.id);
                                      if (q) saveQuarter(objId, q);
                                    }} 
                                    disabled={quarter.saving || !quarter.dirty}
                                    className="sm:hidden"
                                    title="Salva"
                                  >
                                    {quarter.saving ? (
                                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                      </svg>
                                    ) : (
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => {
                                      const { objectiveId: objId, quarter: q } = findObjectiveForQuarter(quarter.id);
                                      if (q) handleResetQuarter(objId, q);
                                    }} 
                                    disabled={quarter.saving}
                                    className="hidden sm:inline-flex"
                                    title="Reset"
                                  >
                                    Reset
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => {
                                      const { objectiveId: objId, quarter: q } = findObjectiveForQuarter(quarter.id);
                                      if (q) handleResetQuarter(objId, q);
                                    }} 
                                    disabled={quarter.saving}
                                    className="sm:hidden"
                                    title="Reset"
                                  >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                  </Button>
                                </>
                              )}
                              {!quarter.isNew && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => {
                                    const { objectiveId: objId } = findObjectiveForQuarter(quarter.id);
                                    deleteQuarter(objId, quarter);
                                  }} 
                                  disabled={quarter.saving}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
                                  title="Elimina"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {allQuarterSprints.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={8} className="py-12 text-center text-sm text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                          Nessun quarter sprint ancora configurato.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="keyresults">
              <div className="mb-4 flex items-center justify-end gap-1">
                <Button
                  variant={keyResultFilter === "confirmed" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setKeyResultFilter("confirmed")}
                  className={`text-xs ${keyResultFilter === "confirmed" ? "" : "text-[var(--color-neutral-500)] hover:text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]/70 dark:hover:text-[var(--color-tertiary-ice)]"}`}
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
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  Confermati
                </Button>
                <Button
                  variant={keyResultFilter === "draft" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setKeyResultFilter("draft")}
                  className={`text-xs ${keyResultFilter === "draft" ? "" : "text-[var(--color-neutral-500)] hover:text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]/70 dark:hover:text-[var(--color-tertiary-ice)]"}`}
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
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  In attivazione
                </Button>
              </div>
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[1300px] text-[0.85rem]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Titolo</TableHead>
                      <TableHead className="min-w-[120px]">Metrica</TableHead>
                      <TableHead className="min-w-[180px]">Quarter Sprint (Lookup)</TableHead>
                      <TableHead className="min-w-[180px]">Obiettivo (Lookup)</TableHead>
                      <TableHead className="min-w-[100px]">Target</TableHead>
                      <TableHead className="min-w-[100px]">Progresso</TableHead>
                      <TableHead className="min-w-[80px]">Peso</TableHead>
                      <TableHead className="min-w-[140px] text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allKeyResults
                      .filter((keyResult) => {
                        // Consider "confirmed" only if it's saved (!isNew) AND has all required fields
                        const isConfirmed = !keyResult.isNew && 
                                           keyResult.title.trim() !== "" && 
                                           keyResult.metric.trim() !== "" && 
                                           keyResult.quarterSprintId && 
                                           keyResult.quarterSprintId !== "" &&
                                           keyResult.targetValue && 
                                           keyResult.targetValue !== "";
                        return keyResultFilter === "confirmed" ? isConfirmed : !isConfirmed;
                      })
                      .map((keyResult) => {
                      const { objectiveId, quarterId } = findObjectiveForKeyResult(keyResult.id);
                      const keyResultActions: ActionItem[] = [
                        {
                          label: "Salva",
                          description: "Aggiorna questo key result",
                          icon: <SaveIcon />,
                          onSelect: () => {
                            const { objectiveId: objId, quarterId: qId, keyResult: kr } = findObjectiveForKeyResult(keyResult.id);
                            if (kr) saveKeyResult(objId, qId, kr);
                          },
                          disabled: keyResult.saving || !keyResult.dirty,
                        },
                        {
                          label: "Annulla",
                          description: "Ripristina i valori",
                          icon: <ResetIcon />,
                          onSelect: () => {
                            const { objectiveId: objId, quarterId: qId, keyResult: kr } = findObjectiveForKeyResult(keyResult.id);
                            if (kr) handleResetKeyResult(objId, qId, kr);
                          },
                          disabled: keyResult.saving,
                        },
                      ];

                      // Get objective title from lookup
                      const objTitle = objectives.find((o) => o.id === objectiveId || o.quarterSprints.some((qs) => qs.id === keyResult.quarterSprintId))?.title || "";
                      
                      // Check if key result is ready to save
                      const isReadyToSave = keyResult.title.trim() !== "" && 
                                           keyResult.metric.trim() !== "" && 
                                           keyResult.quarterSprintId && 
                                           keyResult.quarterSprintId !== "" &&
                                           keyResult.targetValue.trim() !== "";

                      return (
                        <TableRow key={keyResult.id} className={cn("border-t", !isReadyToSave && keyResult.dirty && "bg-yellow-50/30 dark:bg-yellow-900/10")}>
                          <TableCell>
                            <Input
                              value={keyResult.title}
                              onChange={(event) => {
                                const { objectiveId: objId, quarterId: qId } = findObjectiveForKeyResult(keyResult.id);
                                updateKeyResult(objId, qId, keyResult.id, { title: event.target.value });
                              }}
                              placeholder="Titolo key result *"
                              className={!keyResult.title.trim() && keyResult.dirty ? "border-red-300 dark:border-red-700" : ""}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={keyResult.metric}
                              onChange={(event) => {
                                const { objectiveId: objId, quarterId: qId } = findObjectiveForKeyResult(keyResult.id);
                                updateKeyResult(objId, qId, keyResult.id, { metric: event.target.value });
                              }}
                              placeholder="Metrica *"
                              className={!keyResult.metric.trim() && keyResult.dirty ? "border-red-300 dark:border-red-700" : ""}
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={keyResult.quarterSprintId || ""}
                              onChange={(event) => {
                                const { objectiveId: objId, quarterId: qId } = findObjectiveForKeyResult(keyResult.id);
                                updateKeyResult(objId, qId, keyResult.id, { quarterSprintId: event.target.value });
                              }}
                              className={!keyResult.quarterSprintId || keyResult.quarterSprintId === "" ? "border-red-300 dark:border-red-700" : ""}
                            >
                              <option value="">⚠️ Seleziona Quarter Sprint</option>
                              {quarterOptions.length === 0 ? (
                                <option value="" disabled>Nessun Quarter Sprint disponibile. Crea prima un Quarter Sprint.</option>
                              ) : (
                                quarterOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))
                              )}
                            </Select>
                            {(!keyResult.quarterSprintId || keyResult.quarterSprintId === "") && (
                              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                ⚠️ Obbligatorio: ogni Key Result deve essere associato a un Quarter Sprint
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{objTitle || "-"}</span>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              value={keyResult.targetValue}
                              onChange={(event) => {
                                const { objectiveId: objId, quarterId: qId } = findObjectiveForKeyResult(keyResult.id);
                                updateKeyResult(objId, qId, keyResult.id, { targetValue: event.target.value });
                              }}
                              placeholder="Target *"
                              className={!keyResult.targetValue.trim() && keyResult.dirty ? "border-red-300 dark:border-red-700" : ""}
                            />
                            {!keyResult.targetValue.trim() && keyResult.dirty && (
                              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                ⚠️ Obbligatorio: valore numerico
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              value={keyResult.progressValue}
                              onChange={(event) => {
                                const { objectiveId: objId, quarterId: qId } = findObjectiveForKeyResult(keyResult.id);
                                updateKeyResult(objId, qId, keyResult.id, { progressValue: event.target.value });
                              }}
                              placeholder="Progresso"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={keyResult.weight}
                              onChange={(event) => {
                                const { objectiveId: objId, quarterId: qId } = findObjectiveForKeyResult(keyResult.id);
                                updateKeyResult(objId, qId, keyResult.id, { weight: event.target.value });
                              }}
                              placeholder="Peso"
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {keyResult.dirty && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="primary" 
                                    onClick={() => {
                                      const { objectiveId: objId, quarterId: qId, keyResult: kr } = findObjectiveForKeyResult(keyResult.id);
                                      if (kr) saveKeyResult(objId, qId, kr);
                                    }} 
                                    disabled={keyResult.saving || !keyResult.dirty}
                                    className="hidden sm:inline-flex"
                                    title="Salva"
                                  >
                                    {keyResult.saving ? "Salvataggio..." : "Salva"}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="primary" 
                                    onClick={() => {
                                      const { objectiveId: objId, quarterId: qId, keyResult: kr } = findObjectiveForKeyResult(keyResult.id);
                                      if (kr) saveKeyResult(objId, qId, kr);
                                    }} 
                                    disabled={keyResult.saving || !keyResult.dirty}
                                    className="sm:hidden"
                                    title="Salva"
                                  >
                                    {keyResult.saving ? (
                                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                      </svg>
                                    ) : (
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => {
                                      const { objectiveId: objId, quarterId: qId, keyResult: kr } = findObjectiveForKeyResult(keyResult.id);
                                      if (kr) handleResetKeyResult(objId, qId, kr);
                                    }} 
                                    disabled={keyResult.saving}
                                    className="hidden sm:inline-flex"
                                    title="Reset"
                                  >
                                    Reset
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => {
                                      const { objectiveId: objId, quarterId: qId, keyResult: kr } = findObjectiveForKeyResult(keyResult.id);
                                      if (kr) handleResetKeyResult(objId, qId, kr);
                                    }} 
                                    disabled={keyResult.saving}
                                    className="sm:hidden"
                                    title="Reset"
                                  >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                  </Button>
                                </>
                              )}
                              {!keyResult.isNew && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => {
                                    const { objectiveId: objId, quarterId: qId, keyResult: kr } = findObjectiveForKeyResult(keyResult.id);
                                    if (kr) deleteKeyResult(objId, qId, kr);
                                  }} 
                                  disabled={keyResult.saving}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
                                  title="Elimina"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {allKeyResults.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={8} className="py-12 text-center text-sm text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                          <div className="flex flex-col items-center gap-3">
                            <p>Nessun key result ancora configurato.</p>
                            <p className="text-xs text-[var(--color-neutral-400)] dark:text-[var(--color-tertiary-ice)]/50">
                              Crea prima un Obiettivo e un Quarter Sprint, poi aggiungi i Key Results.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateObjectiveModal
        isOpen={isObjectiveModalOpen}
        onClose={() => setIsObjectiveModalOpen(false)}
        onSave={handleCreateObjective}
        fiscalYears={fiscalYears}
      />

      <CreateQuarterSprintModal
        isOpen={isQuarterModalOpen}
        onClose={() => setIsQuarterModalOpen(false)}
        onSave={handleCreateQuarterSprint}
        objectives={objectiveOptions.map((opt) => ({
          id: opt.value,
          title: opt.label,
        }))}
        fiscalYears={fiscalYears}
      />

      <CreateKeyResultModal
        isOpen={isKeyResultModalOpen}
        onClose={() => setIsKeyResultModalOpen(false)}
        onSave={handleCreateKeyResult}
        quarterSprints={allQuarterSprints
          .filter((qs) => !qs.isNew)
          .map((qs) => {
            const obj = objectives.find((o) => o.quarterSprints.some((q) => q.id === qs.id));
            return {
              id: qs.id,
              name: qs.name || "Quarter Sprint",
              objectiveTitle: obj?.title || "Obiettivo sconosciuto",
            };
          })}
        currentUserId={currentUserId}
      />
    </div>
  );
}
