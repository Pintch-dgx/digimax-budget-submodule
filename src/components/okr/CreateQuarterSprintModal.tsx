"use client";

import { useState, useEffect } from "react";
import { Modal, Input, Select, Button, useToast } from "@/components/ui";
import type { FiscalYearOption } from "./OkrSheetTypes";

interface ObjectiveOption {
  id: string;
  title: string;
}

interface CreateQuarterSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    objectiveSummary: string;
    objectiveId: number;
    startDate: string;
    endDate: string;
    fiscalYearId: number;
    quarter: number;
    code?: string;
    shortCode?: string;
  }) => Promise<void>;
  objectives: ObjectiveOption[];
  fiscalYears: FiscalYearOption[];
}

export function CreateQuarterSprintModal({
  isOpen,
  onClose,
  onSave,
  objectives,
  fiscalYears,
}: CreateQuarterSprintModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    objectiveSummary: "",
    objectiveId: "",
    startDate: "",
    endDate: "",
    fiscalYearId: "",
    quarter: "1",
    code: "",
    shortCode: "",
  });

  // Auto-select first objective and fiscal year when modal opens
  useEffect(() => {
    if (isOpen) {
      if (objectives.length > 0 && !formData.objectiveId) {
        setFormData((prev) => ({ ...prev, objectiveId: String(objectives[0].id) }));
      }
      if (fiscalYears.length > 0 && !formData.fiscalYearId) {
        setFormData((prev) => ({ ...prev, fiscalYearId: String(fiscalYears[0].id) }));
      }
    }
  }, [isOpen, objectives, fiscalYears, formData.objectiveId, formData.fiscalYearId]);

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast({ variant: "warning", title: "Nome richiesto", description: "Inserisci un nome per il Quarter Sprint" });
      return;
    }
    if (!formData.objectiveId) {
      toast({
        variant: "warning",
        title: "Obiettivo richiesto",
        description: "Seleziona un obiettivo per il Quarter Sprint",
      });
      return;
    }
    if (!formData.startDate) {
      toast({ variant: "warning", title: "Data di inizio richiesta", description: "Inserisci la data di inizio" });
      return;
    }
    if (!formData.endDate) {
      toast({ variant: "warning", title: "Data di fine richiesta", description: "Inserisci la data di fine" });
      return;
    }
    if (!formData.fiscalYearId) {
      toast({ variant: "warning", title: "Anno fiscale richiesto", description: "Seleziona un anno fiscale" });
      return;
    }

    // Validate dates
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast({
        variant: "warning",
        title: "Date non valide",
        description: "La data di fine deve essere successiva alla data di inizio",
      });
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: formData.name,
        objectiveSummary: formData.objectiveSummary,
        objectiveId: Number(formData.objectiveId),
        startDate: formData.startDate,
        endDate: formData.endDate,
        fiscalYearId: Number(formData.fiscalYearId),
        quarter: Number(formData.quarter),
        code: formData.code || undefined,
        shortCode: formData.shortCode || undefined,
      });

      // Reset form
      setFormData({
        name: "",
        objectiveSummary: "",
        objectiveId: objectives.length > 0 ? String(objectives[0].id) : "",
        startDate: "",
        endDate: "",
        fiscalYearId: fiscalYears.length > 0 ? String(fiscalYears[0].id) : "",
        quarter: "1",
        code: "",
        shortCode: "",
      });

      onClose();
    } catch (error) {
      console.error("Error saving quarter sprint:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setFormData({
        name: "",
        objectiveSummary: "",
        objectiveId: objectives.length > 0 ? String(objectives[0].id) : "",
        startDate: "",
        endDate: "",
        fiscalYearId: fiscalYears.length > 0 ? String(fiscalYears[0].id) : "",
        quarter: "1",
        code: "",
        shortCode: "",
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Crea Nuovo Quarter Sprint" size="lg">
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-primary)]">
            Nome <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Es: Q1 2024 - Brand Awareness"
            disabled={saving}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-primary)]">Summary</label>
          <textarea
            value={formData.objectiveSummary}
            onChange={(e) => setFormData({ ...formData, objectiveSummary: e.target.value })}
            placeholder="Breve riepilogo del quarter sprint..."
            disabled={saving}
            rows={3}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--color-primary)] placeholder:text-[var(--color-neutral-400)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-primary)]">
            Obiettivo <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.objectiveId}
            onChange={(e) => setFormData({ ...formData, objectiveId: e.target.value })}
            disabled={saving || objectives.length === 0}
          >
            {objectives.length === 0 ? (
              <option value="">Nessun obiettivo disponibile</option>
            ) : (
              objectives.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.title}
                </option>
              ))
            )}
          </Select>
          {objectives.length === 0 && (
            <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
              Crea prima un obiettivo dal tab "Obiettivi"
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-primary)]">
              Data Inizio <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              disabled={saving}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-primary)]">
              Data Fine <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              disabled={saving}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-primary)]">
              Anno Fiscale <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.fiscalYearId}
              onChange={(e) => setFormData({ ...formData, fiscalYearId: e.target.value })}
              disabled={saving || fiscalYears.length === 0}
            >
              {fiscalYears.length === 0 ? (
                <option value="">Nessun anno fiscale disponibile</option>
              ) : (
                fiscalYears.map((fy) => (
                  <option key={fy.id} value={fy.id}>
                    {fy.label || fy.code}
                  </option>
                ))
              )}
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-primary)]">
              Quarter <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.quarter}
              onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}
              disabled={saving}
            >
              <option value="1">Q1</option>
              <option value="2">Q2</option>
              <option value="3">Q3</option>
              <option value="4">Q4</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-primary)]">Codice</label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Es: Q1-2024-BA"
              disabled={saving}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-primary)]">Codice Breve</label>
            <Input
              value={formData.shortCode}
              onChange={(e) => setFormData({ ...formData, shortCode: e.target.value })}
              placeholder="Es: Q1BA"
              disabled={saving}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvataggio..." : "Crea Quarter Sprint"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

