"use client";

import { DashboardWrapper } from "@/components/layout/DashboardWrapper";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Button, Input, Select, useToast } from "@/components/ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { QuarterSprintOption, KeyResultOption, FiscalYearOption } from "@/components/okr/OkrSheetTypes";

export default function NewBudgetRequestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [quarterSprintId, setQuarterSprintId] = useState("");
  const [keyResultId, setKeyResultId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [quarterSprints, setQuarterSprints] = useState<QuarterSprintOption[]>([]);
  const [keyResults, setKeyResults] = useState<KeyResultOption[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYearOption[]>([]);

  const fetchReferenceData = useCallback(async () => {
    try {
      setOptionsError(null);
      setLoadingOptions(true);

      const [quarterRes, keyRes, fiscalYearRes] = await Promise.all([
        fetch("/api/quarter-sprints?withCounts=true", { credentials: "include", cache: "no-store" }),
        fetch("/api/key-results", { credentials: "include", cache: "no-store" }),
        fetch("/api/fiscal-years", { credentials: "include", cache: "no-store" }),
      ]);

      if (!quarterRes.ok) {
        const data = await quarterRes.json().catch(() => ({}));
        throw new Error(data.error || "Impossibile caricare i quarter sprint");
      }
      const quarterJson = await quarterRes.json();
      const quarterData: QuarterSprintOption[] = quarterJson.data ?? quarterJson;
      setQuarterSprints(quarterData);

      if (!keyRes.ok) {
        const data = await keyRes.json().catch(() => ({}));
        throw new Error(data.error || "Impossibile caricare i Key Result");
      }
      const keyJson = await keyRes.json();
      const keyData: KeyResultOption[] = keyJson.data ?? keyJson;
      setKeyResults(keyData);

      if (!fiscalYearRes.ok) {
        const data = await fiscalYearRes.json().catch(() => ({}));
        throw new Error(data.error || "Impossibile caricare gli anni fiscali");
      }
      const fiscalYearData: FiscalYearOption[] = await fiscalYearRes.json();
      setFiscalYears(fiscalYearData);

    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore nel caricamento dei riferimenti";
      setOptionsError(message);
      toast({ variant: "error", title: "Errore dati", description: message });
    } finally {
      setLoadingOptions(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  useEffect(() => {
    if (!keyResultId) {
      return;
    }
    const selected = keyResults.find((kr) => kr.id === Number(keyResultId));
    if (selected?.quarterSprintId && selected.quarterSprintId.toString() !== quarterSprintId) {
      setQuarterSprintId(selected.quarterSprintId.toString());
    }
  }, [keyResultId, keyResults, quarterSprintId]);

  useEffect(() => {
    if (!quarterSprintId || !keyResultId) {
      return;
    }
    const selected = keyResults.find((kr) => kr.id === Number(keyResultId));
    if (selected && selected.quarterSprintId && selected.quarterSprintId.toString() !== quarterSprintId) {
      setKeyResultId("");
    }
  }, [quarterSprintId, keyResultId, keyResults]);

  const availableKeyResults = useMemo(() => {
    if (!quarterSprintId) {
      return keyResults;
    }
    const parsed = Number(quarterSprintId);
    if (Number.isNaN(parsed)) {
      return keyResults;
    }
    return keyResults.filter((kr) => kr.quarterSprintId == null || kr.quarterSprintId === parsed);
  }, [quarterSprintId, keyResults]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const requestData = {
      title,
      amount: parseFloat(amount),
      dueDate,
      notes: notes || null,
      quarterSprintId: quarterSprintId ? Number(quarterSprintId) : null,
      keyResultId: keyResultId ? Number(keyResultId) : null,
    };

    try {
      const response = await fetch("/api/budget-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        type ErrorBody = {
          error?: string;
          details?: string;
          raw?: string;
        };

        const responseText = await response.text();
        let data: ErrorBody = {};

        try {
          if (responseText) {
            data = JSON.parse(responseText) as ErrorBody;
          }
        } catch {
          data = { error: `HTTP ${response.status}: ${response.statusText}`, raw: responseText };
        }

        let errorMessage = data.error || data.details || data.raw || `HTTP ${response.status}: Failed to create budget request`;
        
        // Messaggi più user-friendly
        if (response.status === 401) {
          if (data.error?.includes("No session")) {
            errorMessage = "Sessione non trovata. Per favore effettua di nuovo il login.";
          } else {
            errorMessage = "Sessione scaduta o non valida. Per favore effettua di nuovo il login.";
          }
        } else if (response.status === 404 && data.error?.includes("User not found")) {
          errorMessage = "Utente non trovato nel database. Verifica di essere correttamente autenticato.";
        }
        
        throw new Error(errorMessage);
      }

      await response.json();
      toast({ variant: "success", title: "Richiesta creata", description: "La richiesta è stata registrata correttamente." });
      router.push("/budget-requests");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Si è verificato un errore";
      setError(message);
      toast({ variant: "error", title: "Errore", description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardWrapper>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold">Nuova Richiesta Budget</h1>
          <p className="text-sm text-[var(--color-neutral-500)]">
            Compila il modulo per creare una nuova richiesta di budget.
          </p>
        </div>

        <Card className="border border-[var(--color-neutral-200)] bg-[var(--surface)] shadow-[var(--shadow-md)] dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]">
          <CardHeader>
            <CardTitle>Crea Richiesta Budget</CardTitle>
            <CardDescription>Compila tutti i campi richiesti per inviare la richiesta.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {optionsError && (
                <div className="rounded-[var(--radius-md)] border border-[#f5b1ac] bg-[#fbe2e0] p-3 text-sm text-[#b93c35]">
                  {optionsError}
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="quarterSprint" className="mb-2 block text-sm font-semibold text-[var(--color-neutral-600)]">
                    Quarter Sprint di riferimento
                  </label>
                  <Select
                    id="quarterSprint"
                    value={quarterSprintId}
                    onChange={(event) => setQuarterSprintId(event.target.value)}
                    disabled={loadingOptions}
                  >
                    <option value="">Seleziona un quarter sprint</option>
                    {quarterSprints.map((qs) => (
                      <option key={qs.id} value={qs.id}>
                        {qs.shortCode ? `${qs.shortCode} · ${qs.name}` : qs.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label htmlFor="keyResult" className="mb-2 block text-sm font-semibold text-[var(--color-neutral-600)]">
                    Metrica Key Result
                  </label>
                  <Select
                    id="keyResult"
                    value={keyResultId}
                    onChange={(event) => setKeyResultId(event.target.value)}
                    disabled={loadingOptions || availableKeyResults.length === 0}
                  >
                    <option value="">Collega una metrica OKR</option>
                    {availableKeyResults.map((kr) => (
                      <option key={kr.id} value={kr.id}>
                        {kr.metric} · {kr.title}
                      </option>
                    ))}
                  </Select>
                  {quarterSprintId && availableKeyResults.length === 0 && (
                    <p className="mt-1 text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                      Nessun Key Result associato al quarter sprint selezionato.
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="title" className="mb-2 block text-sm font-semibold text-[var(--color-neutral-600)]">
                  Titolo Richiesta *
                </label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Es. Media plan LinkedIn Q4"
                  required
                />
              </div>

              <div>
                <label htmlFor="amount" className="mb-2 block text-sm font-semibold text-[var(--color-neutral-600)]">
                  Importo (€) *
                </label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Es. 50000"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label htmlFor="dueDate" className="mb-2 block text-sm font-semibold text-[var(--color-neutral-600)]">
                  Data Scadenza *
                </label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div>
                <label htmlFor="notes" className="mb-2 block text-sm font-semibold text-[var(--color-neutral-600)]">
                  Note
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Descrizione dettagliata della richiesta..."
                  className="w-full rounded-[var(--radius-md)] border border-transparent bg-white/80 px-4 py-2 text-sm text-[var(--color-primary)] shadow-[var(--shadow-sm)] transition-all focus:border-[var(--color-secondary-cerulean)] focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary-cerulean)] focus:ring-offset-1 focus:ring-offset-[var(--color-tertiary-ice)]"
                  rows={4}
                />
              </div>

              {error && (
                <div className="rounded-[var(--radius-md)] border border-[#f5b1ac] bg-[#fbe2e0] p-3 text-sm text-[#b93c35]">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? "Creazione..." : "Crea Richiesta"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

      </div>
    </DashboardWrapper>
  );
}

