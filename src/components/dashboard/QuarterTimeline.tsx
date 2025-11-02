"use client";

import { cn } from "@/lib/utils";
import type { QuarterSprintSummary } from "@/lib/dashboard-service";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { Select } from "@/components/ui/Select";

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

type NormalizedQuarter = QuarterSprintSummary & {
  start: Date | null;
  end: Date | null;
};

function normalizeQuarters(quarters: QuarterSprintSummary[]): NormalizedQuarter[] {
  return quarters.map((quarter) => ({
    ...quarter,
    start: parseDate(quarter.startDate),
    end: parseDate(quarter.endDate),
  }));
}

// Genera array di date per la timeline (ogni mese)
function generateTimelineMonths(startDate: Date, endDate: Date): Date[] {
  const months: Date[] = [];
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (current <= end) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

// Genera opzioni di mesi per il filtro (da 12 mesi fa a 12 mesi avanti)
function generateMonthOptions(): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [];
  const now = new Date();
  
  // Genera da 12 mesi fa a 12 mesi avanti
  for (let i = -12; i <= 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
    options.push({ value, label });
  }
  
  return options;
}

type QuarterTimelineProps = {
  quarters: QuarterSprintSummary[];
};

export function QuarterTimeline({ quarters }: QuarterTimelineProps) {
  const [expandedQuarters, setExpandedQuarters] = useState<Set<string>>(new Set());
  
  const normalized = normalizeQuarters(quarters);
  const validQuarters = normalized.filter((quarter) => quarter.start || quarter.end);

  // Calcola il mese corrente come default, ma se ci sono quarters da novembre 2024, usa quello
  const now = new Date();
  const hasNov2024Data = validQuarters.some((q) => {
    if (!q.start) return false;
    const qDate = new Date(q.start);
    return qDate.getFullYear() === 2024 && qDate.getMonth() === 10; // novembre è mese 10 (0-indexed)
  });
  
  const defaultStartDate = hasNov2024Data 
    ? new Date(2024, 10, 1) // novembre 2024
    : new Date(now.getFullYear(), now.getMonth(), 1);
  
  const defaultStartMonth = `${defaultStartDate.getFullYear()}-${String(defaultStartDate.getMonth() + 1).padStart(2, '0')}`;
  
  const [selectedStartMonth, setSelectedStartMonth] = useState<string>(defaultStartMonth);

  // Calcola la finestra temporale basata sul mese selezionato (6 mesi)
  const timelineWindow = useMemo(() => {
    const [year, month] = selectedStartMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month + 5, 0); // Ultimo giorno del sesto mese
    
    return { startDate, endDate };
  }, [selectedStartMonth]);

  // Filtra i quarters che si sovrappongono alla finestra temporale
  const visibleQuarters = useMemo(() => {
    return validQuarters.filter((quarter) => {
      if (!quarter.start && !quarter.end) return false;
      
      const quarterStart = quarter.start ?? quarter.end!;
      const quarterEnd = quarter.end ?? quarter.start!;
      
      // Controlla se il quarter si sovrappone alla finestra
      return quarterStart <= timelineWindow.endDate && quarterEnd >= timelineWindow.startDate;
    });
  }, [validQuarters, timelineWindow]);

  if (validQuarters.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-neutral-300)] bg-[var(--surface)]/60 text-sm text-[var(--color-neutral-500)] dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]">
        Nessuna pianificazione quarter disponibile.
      </div>
    );
  }

  const monthOptions = generateMonthOptions();
  const timelineStart = timelineWindow.startDate;
  const timelineEnd = timelineWindow.endDate;
  
  // Estendi di 1 mese per migliore visualizzazione
  const displayEnd = new Date(timelineEnd);
  displayEnd.setMonth(displayEnd.getMonth() + 1);

  const totalDuration = Math.max(displayEnd.getTime() - timelineStart.getTime(), 1);
  const timelineMonths = generateTimelineMonths(timelineStart, displayEnd);

  const toggleQuarter = (quarterId: string) => {
    const newExpanded = new Set(expandedQuarters);
    if (newExpanded.has(quarterId)) {
      newExpanded.delete(quarterId);
    } else {
      newExpanded.add(quarterId);
    }
    setExpandedQuarters(newExpanded);
  };

  const getPosition = (date: Date): number => {
    return ((date.getTime() - timelineStart.getTime()) / totalDuration) * 100;
  };

  const taskRowHeight = 60;

  return (
    <div className="w-full">
      {/* Filtro Mese */}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-[var(--color-neutral-700)] dark:text-[var(--color-tertiary-ice)]">
          Mostra da:
        </label>
        <Select
          value={selectedStartMonth}
          onChange={(e) => setSelectedStartMonth(e.target.value)}
          className="w-48"
        >
          {monthOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <span className="text-xs text-[var(--color-neutral-500)]">
          (6 mesi)
        </span>
      </div>

      <div className="w-full overflow-x-auto rounded-lg border border-[var(--color-neutral-200)] bg-transparent dark:border-[var(--color-neutral-100)]">
        {/* Header Timeline */}
        <div className="sticky top-0 z-10 bg-transparent">
          <div className="flex">
            {/* Colonna Task (sinistra) */}
            <div className="w-64 flex-shrink-0 border-r border-[var(--color-neutral-200)] px-4 py-3 dark:border-[var(--color-neutral-100)]">
              <h3 className="text-sm font-semibold text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]">
                Sequenza Temporale
              </h3>
            </div>

            {/* Timeline Header (destra) - Colonne uniformi per mese */}
            <div className="relative flex-1 min-w-[600px] sm:min-w-[800px] lg:min-w-[1000px] xl:min-w-[1200px] h-12 border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-100)]">
              {timelineMonths.map((month, index) => {
                // Calcola la posizione e larghezza uniforme per ogni mese
                const monthWidth = 100 / timelineMonths.length;
                const position = index * monthWidth;

                return (
                  <div
                    key={month.getTime()}
                    className="absolute top-0 h-full border-l border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-100)]"
                    style={{
                      left: `${position}%`,
                      width: `${monthWidth}%`,
                    }}
                  >
                    <div className="absolute left-1 top-2 text-xs text-[var(--color-neutral-600)] dark:text-[var(--color-tertiary-ice)]/80 whitespace-nowrap">
                      {month.toLocaleDateString("it-IT", { month: "short", year: "2-digit" })}
                    </div>
                  </div>
                );
              })}

              {/* Linea data corrente */}
              {now >= timelineStart && now <= displayEnd && (
                <div
                  className="absolute top-0 h-full w-0.5 bg-red-500 z-20"
                  style={{ left: `${getPosition(now)}%` }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Body Gantt */}
        <div className="flex">
          {/* Lista Task (sinistra) */}
          <div className="w-64 flex-shrink-0 border-r border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-100)]">
            {visibleQuarters.map((quarter) => {
              const isExpanded = expandedQuarters.has(quarter.id.toString());
              const isCurrent = quarter.start && quarter.end && now >= quarter.start && now <= quarter.end;

              return (
                <div
                  key={quarter.id}
                  className={cn(
                    "border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-100)]",
                    isCurrent && "bg-blue-50/50 dark:bg-blue-950/10"
                  )}
                >
                  <div
                    className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-[var(--surface-muted)] transition-colors"
                    style={{ minHeight: `${taskRowHeight}px` }}
                    onClick={() => toggleQuarter(quarter.id.toString())}
                  >
                    <button className="flex-shrink-0 text-[var(--color-neutral-400)] hover:text-[var(--color-primary)]">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)] truncate">
                        {quarter.objective?.title ?? quarter.name}
                      </div>
                      {isExpanded && (
                        <div className="mt-1 text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/80">
                          {quarter.start && quarter.end && (
                            <p className="mt-1 text-[10px] text-[var(--color-neutral-400)]">
                              {quarter.start.toLocaleDateString("it-IT", { month: "short", day: "numeric" })}
                              {" → "}
                              {quarter.end.toLocaleDateString("it-IT", { month: "short", day: "numeric" })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Area Gantt Bars (destra) */}
          <div className="relative flex-1 min-w-[600px] sm:min-w-[800px] lg:min-w-[1000px] xl:min-w-[1200px]">
            {visibleQuarters.map((quarter, index) => {
              if (!quarter.start || !quarter.end) {
                return null;
              }
              
              const isCurrent = now >= quarter.start && now <= quarter.end;
              const monthWidth = 100 / timelineMonths.length;
              
              // Calcola quali mesi sono coperti dallo sprint
              const coveredMonths: number[] = [];
              
              // Itera attraverso tutti i mesi visibili nella timeline
              timelineMonths.forEach((month, monthIndex) => {
                // Crea date locali per il mese (primo e ultimo giorno)
                const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
                const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
                
                // Normalizza le date dello sprint per il confronto
                if (quarter.start && quarter.end) {
                  const sprintStart = new Date(quarter.start.getFullYear(), quarter.start.getMonth(), quarter.start.getDate());
                  const sprintEnd = new Date(quarter.end.getFullYear(), quarter.end.getMonth(), quarter.end.getDate());
                  
                  // Verifica se lo sprint si sovrappone a questo mese
                  // Lo sprint copre il mese se inizia prima della fine del mese E finisce dopo l'inizio del mese
                  if (sprintStart <= monthEnd && sprintEnd >= monthStart) {
                    coveredMonths.push(monthIndex);
                  }
                }
              });

              // Raggruppa mesi consecutivi in range continui
              const monthRanges: Array<{ start: number; end: number }> = [];
              if (coveredMonths.length > 0) {
                let currentRange = { start: coveredMonths[0], end: coveredMonths[0] };
                
                for (let i = 1; i < coveredMonths.length; i++) {
                  if (coveredMonths[i] === currentRange.end + 1) {
                    // Continuazione del range corrente
                    currentRange.end = coveredMonths[i];
                  } else {
                    // Nuovo range
                    monthRanges.push(currentRange);
                    currentRange = { start: coveredMonths[i], end: coveredMonths[i] };
                  }
                }
                // Aggiungi l'ultimo range
                monthRanges.push(currentRange);
              }

              // Debug: mostra solo se ci sono mesi coperti
              if (monthRanges.length === 0) {
                console.warn('Quarter senza mesi coperti:', quarter.name, {
                  start: quarter.start,
                  end: quarter.end,
                  timelineStart,
                  displayEnd,
                  timelineMonths: timelineMonths.map(m => `${m.getFullYear()}-${m.getMonth() + 1}`)
                });
              }

              return (
                <div
                  key={quarter.id}
                  className="absolute border-b border-[var(--color-neutral-200)] dark:border-[var(--color-neutral-100)]"
                  style={{
                    top: `${index * taskRowHeight}px`,
                    height: `${taskRowHeight}px`,
                    width: '100%',
                  }}
                >
                  {/* Barre continue per ogni range di mesi consecutivi */}
                  {monthRanges.map((range, rangeIndex) => {
                    const left = range.start * monthWidth;
                    const width = (range.end - range.start + 1) * monthWidth;

                    return (
                      <div
                        key={`${range.start}-${range.end}`}
                        className={cn(
                          "absolute rounded-sm",
                          isCurrent 
                            ? "bg-blue-500 ring-2 ring-blue-300" 
                            : "bg-blue-400"
                        )}
                        style={{
                          left: `${left}%`,
                          top: '20px',
                          width: `${width}%`,
                          height: '24px',
                          zIndex: 10,
                        }}
                        title={`${quarter.name}: ${quarter.start?.toLocaleDateString("it-IT")} - ${quarter.end?.toLocaleDateString("it-IT")}`}
                      />
                    );
                  })}
                </div>
              );
            })}

            {/* Grid lines verticali */}
            {timelineMonths.map((month, monthIndex) => {
              const monthWidth = 100 / timelineMonths.length;
              const position = monthIndex * monthWidth;
              
              return (
                <div
                  key={month.getTime()}
                  className="absolute top-0 w-px bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-200)]/30 pointer-events-none"
                  style={{
                    left: `${position}%`,
                    height: `${visibleQuarters.length * taskRowHeight}px`,
                  }}
                />
              );
            })}

            {/* Linea data corrente */}
            {now >= timelineStart && now <= displayEnd && (
              <div
                className="absolute top-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                style={{
                  left: `${getPosition(now)}%`,
                  height: `${visibleQuarters.length * taskRowHeight}px`,
                }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
