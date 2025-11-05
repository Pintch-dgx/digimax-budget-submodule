"use client";

import { DashboardWrapper } from "@/components/layout/DashboardWrapper";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Button, Input, Select, useToast } from "@/components/ui";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type FiscalYearOption = {
  id: number;
  code: string;
  label: string;
};

type ChannelOption = {
  id: number;
  name: string;
  slug: string;
};

type UserOption = {
  id: number;
  fullName: string;
  email: string;
};

export default function NewCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Form fields
  const [name, setName] = useState("");
  const [fiscalYearId, setFiscalYearId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [objectiveId, setObjectiveId] = useState("");
  const [goal, setGoal] = useState("");
  const [status, setStatus] = useState("PLANNED");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // Reference data
  const [fiscalYears, setFiscalYears] = useState<FiscalYearOption[]>([]);
  const [channels, setChannels] = useState<ChannelOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [objectives, setObjectives] = useState<Array<{ id: number; title: string }>>([]);

  // Fetch reference data on mount
  const fetchReferenceData = useCallback(async () => {
    try {
      setOptionsError(null);
      setLoadingOptions(true);

      const [fiscalYearRes, channelsRes, usersRes, objectivesRes] = await Promise.all([
        fetch("/api/fiscal-years", { credentials: "include", cache: "no-store" }),
        fetch("/api/channels", { credentials: "include", cache: "no-store" }),
        fetch("/api/users", { credentials: "include", cache: "no-store" }),
        fetch("/api/objectives", { credentials: "include", cache: "no-store" }),
      ]);

      if (!fiscalYearRes.ok) {
        throw new Error("Impossibile caricare gli anni fiscali");
      }
      const fiscalYearData: FiscalYearOption[] = await fiscalYearRes.json();
      setFiscalYears(fiscalYearData);

      if (!channelsRes.ok) {
        throw new Error("Impossibile caricare i canali");
      }
      const channelsData: ChannelOption[] = await channelsRes.json();
      setChannels(channelsData);

      if (!usersRes.ok) {
        throw new Error("Impossibile caricare gli utenti");
      }
      const usersData: UserOption[] = await usersRes.json();
      setUsers(usersData);

      if (!objectivesRes.ok) {
        throw new Error("Impossibile caricare gli obiettivi");
      }
      const objectivesJson = await objectivesRes.json();
      const objectivesData = Array.isArray(objectivesJson) ? objectivesJson : objectivesJson.data || [];
      setObjectives(objectivesData.map((obj: any) => ({ id: obj.id, title: obj.title })));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore nel caricamento dei dati";
      setOptionsError(message);
      toast({ variant: "error", title: "Errore dati", description: message });
    } finally {
      setLoadingOptions(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const campaignData = {
      name,
      fiscalYearId: fiscalYearId ? Number(fiscalYearId) : null,
      channelId: channelId ? Number(channelId) : null,
      ownerId: ownerId ? Number(ownerId) : null,
      objectiveId: objectiveId ? Number(objectiveId) : null,
      goal: goal || null,
      status,
      startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    };

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const responseText = await response.text();
        let data: any = {};

        try {
          if (responseText) {
            data = JSON.parse(responseText);
          }
        } catch {
          data = { error: `HTTP ${response.status}: ${response.statusText}`, raw: responseText };
        }

        const errorMessage = data.error || data.details || data.raw || `HTTP ${response.status}: Failed to create campaign`;
        throw new Error(errorMessage);
      }

      await response.json();
      toast({
        variant: "success",
        title: "Campagna creata",
        description: "La campagna è stata creata correttamente.",
      });
      
      // Usa window.location invece di router.push per evitare problemi di sessione
      setTimeout(() => {
        window.location.href = "/campaigns";
      }, 800);
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
          <h1 className="text-2xl font-semibold">Nuova Campagna</h1>
          <p className="text-sm text-[var(--color-neutral-500)]">
            Compila il modulo per creare una nuova campagna marketing.
          </p>
        </div>

        <Card className="border border-[var(--color-neutral-200)] bg-[var(--surface)] shadow-[var(--shadow-md)] dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]">
          <CardHeader>
            <CardTitle>Crea Campagna</CardTitle>
            <CardDescription>Compila tutti i campi richiesti per creare la campagna.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {optionsError && (
                <div className="rounded-[var(--radius-md)] border border-[#f5b1ac] bg-[#fbe2e0] p-3 text-sm text-[#b93c35]">
                  {optionsError}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label htmlFor="name" className="mb-2 block text-sm font-semibold text-[var(--color-neutral-600)]">
                    Nome Campagna *
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Es. Campagna Social Media Q1 2025"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="fiscalYear" className="mb-2 block text-sm font-semibold text-[var(--color-neutral-600)]">
                    Anno Fiscale *
                  </label>
                  <Select
                    id="fiscalYear"
                    value={fiscalYearId}
                    onChange={(e) => {
                      setFiscalYearId(e.target.value);
                      setObjectiveId(""); // Reset objective when fiscal year changes
                    }}
                    disabled={loadingOptions}
                    required
                  >
                    <option value="">Seleziona anno fiscale</option>
                    {fiscalYears.map((fy) => (
                      <option key={fy.id} value={fy.id}>
                        {fy.label} ({fy.code})
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label htmlFor="channel" className="mb-2 block text-sm font-semibold text-[var(--color-neutral-600)]">
                    Canale *
                  </label>
                  <Select
                    id="channel"
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                    disabled={loadingOptions}
                    required
                  >
                    <option value="">Seleziona canale</option>
                    {channels.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="owner" className="mb-2 block text-sm font-semibold text-[var(--color-neutral-600)]">
                    Responsabile Campagna *
                  </label>
                  <Select
                    id="owner"
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    disabled={loadingOptions}
                    required
                  >
                    <option value="">Seleziona responsabile</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} ({user.email})
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="objective" className="mb-2 block text-sm font-semibold text-[var(--color-neutral-600)]">
                    Obiettivo Strategico
                  </label>
                  <Select
                    id="objective"
                    value={objectiveId}
                    onChange={(e) => setObjectiveId(e.target.value)}
                    disabled={loadingOptions}
                  >
                    <option value="">Collega a un obiettivo (opzionale)</option>
                    {objectives.map((obj) => (
                      <option key={obj.id} value={obj.id}>
                        {obj.title}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label htmlFor="startDate" className="mb-2 block text-sm font-semibold text-[var(--color-neutral-600)]">
                    Data Inizio *
                  </label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="mb-2 block text-sm font-semibold text-[var(--color-neutral-600)]">
                    Data Fine *
                  </label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    min={startDate || new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="goal" className="mb-2 block text-sm font-semibold text-[var(--color-neutral-600)]">
                  Goal/Obiettivo
                </label>
                <textarea
                  id="goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Descrizione dell'obiettivo specifico della campagna..."
                  className="w-full rounded-[var(--radius-md)] border border-transparent bg-white/80 px-4 py-2 text-sm text-[var(--color-primary)] shadow-[var(--shadow-sm)] transition-all focus:border-[var(--color-secondary-cerulean)] focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary-cerulean)] focus:ring-offset-1 focus:ring-offset-[var(--color-tertiary-ice)]"
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="status" className="mb-2 block text-sm font-semibold text-[var(--color-neutral-600)]">
                    Stato
                  </label>
                  <Select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="PLANNED">Pianificata</option>
                    <option value="ACTIVE">Attiva</option>
                    <option value="PAUSED">In pausa</option>
                    <option value="COMPLETED">Completata</option>
                    <option value="CANCELLED">Cancellata</option>
                  </Select>
                </div>
              </div>

              {error && (
                <div className="rounded-[var(--radius-md)] border border-[#f5b1ac] bg-[#fbe2e0] p-3 text-sm text-[#b93c35]">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? "Creazione..." : "Crea Campagna"}
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

