"use client";

import { useState, useEffect } from "react";
import { Modal, Input, Select, Button, useToast } from "@/components/ui";

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

type QuarterSprintOption = {
  id: number;
  name: string;
  code: string | null;
  shortCode: string | null;
};

type KeyResultOption = {
  id: number;
  title: string;
  quarterSprintId: number | null;
};

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    fiscalYearId: number;
    channelId: number;
    ownerId: number;
    quarterSprintId?: number | null;
    keyResultId?: number | null;
    goal?: string;
    status?: string;
  }) => Promise<void>;
  fiscalYears: FiscalYearOption[];
}

export function CreateCampaignModal({ isOpen, onClose, onSave, fiscalYears }: CreateCampaignModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [channels, setChannels] = useState<ChannelOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [quarterSprints, setQuarterSprints] = useState<QuarterSprintOption[]>([]);
  const [keyResults, setKeyResults] = useState<KeyResultOption[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    fiscalYearId: "",
    channelId: "",
    ownerId: "",
    quarterSprintId: "",
    keyResultId: "",
    goal: "",
    status: "PLANNED",
  });

  // Fetch channels, users, and quarter sprints when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  // Fetch quarter sprints when fiscal year changes
  useEffect(() => {
    if (formData.fiscalYearId) {
      fetchQuarterSprints(Number(formData.fiscalYearId));
    } else {
      setQuarterSprints([]);
      setKeyResults([]);
    }
  }, [formData.fiscalYearId]);

  // Fetch key results when quarter sprint changes
  useEffect(() => {
    if (formData.quarterSprintId) {
      fetchKeyResults(Number(formData.quarterSprintId));
    } else {
      setKeyResults([]);
    }
  }, [formData.quarterSprintId]);

  // Auto-select first fiscal year when modal opens
  useEffect(() => {
    if (isOpen && fiscalYears.length > 0 && !formData.fiscalYearId) {
      setFormData((prev) => ({ ...prev, fiscalYearId: String(fiscalYears[0].id) }));
    }
  }, [isOpen, fiscalYears, formData.fiscalYearId]);

  const fetchInitialData = async () => {
    setLoadingData(true);
    try {
      // Fetch channels from Prisma directly (no API endpoint exists)
      const channelsRes = await fetch("/api/channels", { credentials: "include" });
      if (channelsRes.ok) {
        const channelsData = await channelsRes.json();
        setChannels(channelsData);
      } else {
        // Fallback: fetch from campaigns API and extract unique channels
        const campaignsRes = await fetch("/api/campaigns", { credentials: "include" });
        if (campaignsRes.ok) {
          const campaignsData = await campaignsRes.json();
          const uniqueChannels = Array.from(
            new Map(campaignsData.map((c: any) => [c.channel.id, c.channel])).values()
          ) as ChannelOption[];
          setChannels(uniqueChannels);
        }
      }

      // Fetch users
      const usersRes = await fetch("/api/users", { credentials: "include" });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchQuarterSprints = async (fiscalYearId: number) => {
    try {
      const res = await fetch(`/api/quarter-sprints?fiscalYearId=${fiscalYearId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setQuarterSprints(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching quarter sprints:", error);
    }
  };

  const fetchKeyResults = async (quarterSprintId: number) => {
    try {
      const res = await fetch(`/api/key-results?quarterSprintId=${quarterSprintId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setKeyResults(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching key results:", error);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast({ variant: "warning", title: "Nome richiesto", description: "Inserisci un nome per la campagna" });
      return;
    }
    if (!formData.fiscalYearId) {
      toast({ variant: "warning", title: "Anno fiscale richiesto", description: "Seleziona un anno fiscale" });
      return;
    }
    if (!formData.channelId) {
      toast({ variant: "warning", title: "Canale richiesto", description: "Seleziona un canale" });
      return;
    }
    if (!formData.ownerId) {
      toast({ variant: "warning", title: "Owner richiesto", description: "Seleziona un owner" });
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: formData.name,
        fiscalYearId: Number(formData.fiscalYearId),
        channelId: Number(formData.channelId),
        ownerId: Number(formData.ownerId),
        quarterSprintId: formData.quarterSprintId ? Number(formData.quarterSprintId) : null,
        keyResultId: formData.keyResultId ? Number(formData.keyResultId) : null,
        goal: formData.goal || undefined,
        status: formData.status,
      });
      
      // Reset form
      setFormData({
        name: "",
        fiscalYearId: fiscalYears.length > 0 ? String(fiscalYears[0].id) : "",
        channelId: "",
        ownerId: "",
        quarterSprintId: "",
        keyResultId: "",
        goal: "",
        status: "PLANNED",
      });
      
      onClose();
    } catch (error) {
      console.error("Error saving campaign:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setFormData({
        name: "",
        fiscalYearId: fiscalYears.length > 0 ? String(fiscalYears[0].id) : "",
        channelId: "",
        ownerId: "",
        quarterSprintId: "",
        keyResultId: "",
        goal: "",
        status: "PLANNED",
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Crea Nuova Campagna" size="lg">
      <div className="space-y-6">
        {loadingData && (
          <div className="rounded-[var(--radius-md)] bg-[var(--color-neutral-100)] p-3 text-sm text-[var(--color-neutral-600)] dark:bg-[var(--color-neutral-200)]/30 dark:text-[var(--color-neutral-400)]">
            Caricamento dati...
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[var(--color-primary)] dark:text-[var(--color-neutral-900)]">
              Nome Campagna <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Es: Campagna Social Media Q1"
              disabled={saving}
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-primary)] dark:text-[var(--color-neutral-900)]">
              Anno Fiscale <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.fiscalYearId}
              onChange={(e) => {
                setFormData({ ...formData, fiscalYearId: e.target.value, quarterSprintId: "", keyResultId: "" });
              }}
              disabled={saving}
              className="w-full"
            >
              <option value="">Seleziona...</option>
              {fiscalYears.map((fy) => (
                <option key={fy.id} value={fy.id}>
                  {fy.label} ({fy.code})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-primary)] dark:text-[var(--color-neutral-900)]">
              Canale <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.channelId}
              onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
              disabled={saving || loadingData}
              className="w-full"
            >
              <option value="">Seleziona...</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[var(--color-primary)] dark:text-[var(--color-neutral-900)]">
              Owner <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.ownerId}
              onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
              disabled={saving || loadingData}
              className="w-full"
            >
              <option value="">Seleziona...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} ({user.email})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-primary)] dark:text-[var(--color-neutral-900)]">
              Quarter Sprint (opzionale)
            </label>
            <Select
              value={formData.quarterSprintId}
              onChange={(e) => {
                setFormData({ ...formData, quarterSprintId: e.target.value, keyResultId: "" });
              }}
              disabled={saving || !formData.fiscalYearId}
              className="w-full"
            >
              <option value="">Nessuno</option>
              {quarterSprints.map((qs) => (
                <option key={qs.id} value={qs.id}>
                  {qs.shortCode || qs.code || qs.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-primary)] dark:text-[var(--color-neutral-900)]">
              Key Result (opzionale)
            </label>
            <Select
              value={formData.keyResultId}
              onChange={(e) => setFormData({ ...formData, keyResultId: e.target.value })}
              disabled={saving || !formData.quarterSprintId}
              className="w-full"
            >
              <option value="">Nessuno</option>
              {keyResults.map((kr) => (
                <option key={kr.id} value={kr.id}>
                  {kr.title}
                </option>
              ))}
            </Select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[var(--color-primary)] dark:text-[var(--color-neutral-900)]">
              Goal (opzionale)
            </label>
            <textarea
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              placeholder="Descrizione dell'obiettivo della campagna..."
              disabled={saving}
              rows={3}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--color-primary)] placeholder:text-[var(--color-neutral-400)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-primary)] dark:text-[var(--color-neutral-900)]">
              Stato
            </label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              disabled={saving}
              className="w-full"
            >
              <option value="PLANNED">Pianificata</option>
              <option value="ACTIVE">Attiva</option>
              <option value="PAUSED">In pausa</option>
              <option value="COMPLETED">Completata</option>
              <option value="CANCELLED">Cancellata</option>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--color-neutral-200)] pt-6 dark:border-[var(--color-neutral-100)]">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvataggio..." : "Crea Campagna"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

