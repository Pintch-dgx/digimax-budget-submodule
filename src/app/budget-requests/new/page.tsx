"use client";

import { DashboardWrapper } from "@/components/layout/DashboardWrapper";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Button, Input, Select, useToast } from "@/components/ui";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewBudgetRequestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueDateInput, setDueDateInput] = useState("");
  const [dueDateError, setDueDateError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Array<{ id: number; name: string; fiscalYearId: number; objectiveId: number | null }>>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  const fetchReferenceData = useCallback(async () => {
    try {
      setOptionsError(null);
      setLoadingOptions(true);

      // No need to fetch objectives or key results anymore
      
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

  // Fetch campaigns when needed (optional)
  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoadingCampaigns(true);
      try {
        const response = await fetch(`/api/campaigns`, {
          credentials: "include",
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();
          setCampaigns(Array.isArray(data) ? data : data.data || []);
        } else {
          setCampaigns([]);
        }
      } catch (err) {
        console.error("Error fetching campaigns:", err);
        setCampaigns([]);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Normalize date input: accept DD/MM/YYYY or YYYY-MM-DD formats
  const normalizeDateInput = (input: string): string => {
    if (!input.trim()) return "";
    
    // Already in YYYY-MM-DD format (from date picker)
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return input;
    }
    
    // Try DD/MM/YYYY format
    const ddMmYyyyMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddMmYyyyMatch) {
      const [, day, month, year] = ddMmYyyyMatch;
      const d = parseInt(day, 10);
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      // Validate ranges
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
        // Format as YYYY-MM-DD ensuring 2-digit padding
        return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
    }
    
    // Return original if no match
    return input;
  };

  // Validate date format and ensure it's in the future
  const validateDate = (dateStr: string): { valid: boolean; error?: string; normalized?: string } => {
    if (!dateStr.trim()) {
      return { valid: false, error: "La data è obbligatoria" };
    }

    const normalized = normalizeDateInput(dateStr);
    
    // Check if normalization produced a valid YYYY-MM-DD format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return { valid: false, error: "Formato data non valido. Usa DD/MM/YYYY o YYYY-MM-DD" };
    }

    // Parse date using UTC to avoid timezone issues
    const [year, month, day] = normalized.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    
    // Verify the date is valid (check if day/month/year match)
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      return { valid: false, error: "Data non valida (es. 31/02/2025)" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return { valid: false, error: "La data deve essere futura" };
    }

    return { valid: true, normalized };
  };

  const handleDateInputChange = (value: string) => {
    setDueDateInput(value);
    setDueDateError(null);

    // Try to normalize immediately for DD/MM/YYYY format
    const normalized = normalizeDateInput(value);
    
    // If we successfully normalized (DD/MM/YYYY -> YYYY-MM-DD), update both fields
    if (normalized && normalized !== value && /^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      const validation = validateDate(normalized);
      if (validation.valid) {
        setDueDate(normalized);
        setDueDateInput(normalized);
        setDueDateError(null);
      } else {
        // Keep the input as is, show error on blur
      }
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      // Already in YYYY-MM-DD format
      const validation = validateDate(value);
      if (validation.valid) {
        setDueDate(value);
        setDueDateError(null);
      }
    }
  };

  const handleDateChange = (value: string) => {
    // Handle date picker input (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      setDueDate(value);
      setDueDateInput(value);
      setDueDateError(null);
    }
  };

  const handleDateBlur = () => {
    if (dueDateInput && dueDateInput.trim()) {
      const validation = validateDate(dueDateInput);
      if (validation.valid && validation.normalized) {
        // Ensure both fields are synchronized
        setDueDate(validation.normalized);
        setDueDateInput(validation.normalized);
        setDueDateError(null);
      } else {
        setDueDateError(validation.error || "Formato data non valido");
      }
    } else if (!dueDate) {
      // Clear both fields if input is empty and no date is set
      setDueDate("");
      setDueDateInput("");
      setDueDateError(null);
    }
  };

  const addDaysToDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const normalized = date.toISOString().split("T")[0];
    setDueDate(normalized);
    setDueDateInput(normalized);
    setDueDateError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate campaignId is required
    if (!campaignId) {
      toast({ variant: "error", title: "Errore", description: "La campagna è obbligatoria" });
      return;
    }
    
    // Validate date before submission - use dueDateInput if dueDate is empty
    const dateToValidate = dueDate || dueDateInput;
    if (!dateToValidate) {
      setDueDateError("La data è obbligatoria");
      toast({ variant: "error", title: "Errore", description: "La data è obbligatoria" });
      return;
    }

    const validation = validateDate(dateToValidate);
    if (!validation.valid) {
      setDueDateError(validation.error || "Data non valida");
      toast({ variant: "error", title: "Errore", description: validation.error || "Data non valida" });
      return;
    }

    // Ensure dueDate is set to normalized value
    if (validation.normalized && validation.normalized !== dueDate) {
      setDueDate(validation.normalized);
      setDueDateInput(validation.normalized);
    }

    setIsSubmitting(true);

    const requestData = {
      title,
      amount: parseFloat(amount),
      dueDate,
      notes: notes || null,
      campaignId: Number(campaignId), // Sempre obbligatorio
    };

    console.log("📤 Sending budget request:", requestData);

    try {
      const response = await fetch("/api/budget-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      });
      
      console.log("📨 Response status:", response.status, response.statusText);
      
      if (!response.ok) {
        type ErrorBody = {
          error?: string;
          details?: string;
          raw?: string;
        };

        const responseText = await response.text();
        console.log("📨 Response body:", responseText);
        
        let data: ErrorBody = {};

        try {
          if (responseText) {
            data = JSON.parse(responseText) as ErrorBody;
          }
        } catch {
          data = { error: `HTTP ${response.status}: ${response.statusText}`, raw: responseText };
        }

        console.log("❌ Error data:", data);

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
                  <label htmlFor="campaign" className="mb-2 block text-sm font-semibold text-[var(--color-neutral-600)]">
                    Campagna (opzionale)
                  </label>
                  <Select
                    id="campaign"
                    value={campaignId}
                    onChange={(event) => setCampaignId(event.target.value)}
                    disabled={loadingOptions || loadingCampaigns}
                  >
                    <option value="">Seleziona una campagna</option>
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </option>
                    ))}
                  </Select>
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
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="flex-1"
                      required
                      min={new Date().toISOString().split("T")[0]}
                    />
                    <Input
                      type="text"
                      placeholder="DD/MM/YYYY (opzionale)"
                      value={dueDateInput}
                      onChange={(e) => handleDateInputChange(e.target.value)}
                      onBlur={handleDateBlur}
                      className="flex-1"
                      maxLength={10}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addDaysToDate(30)}
                      className="text-xs"
                    >
                      +1 Mese
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addDaysToDate(90)}
                      className="text-xs"
                    >
                      +1 Trimestre
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addDaysToDate(180)}
                      className="text-xs"
                    >
                      +6 Mesi
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addDaysToDate(365)}
                      className="text-xs"
                    >
                      +1 Anno
                    </Button>
                  </div>
                  {dueDateError && (
                    <p className="text-xs text-[#b93c35]">{dueDateError}</p>
                  )}
                  {!dueDateError && dueDateInput && (
                    <p className="text-xs text-[var(--color-neutral-500)]">
                      Puoi digitare la data nel formato DD/MM/YYYY o usare il calendario
                    </p>
                  )}
                </div>
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

