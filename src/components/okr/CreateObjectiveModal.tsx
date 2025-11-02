"use client";

import { useState, useEffect } from "react";
import { Modal, Input, Select, Button, useToast } from "@/components/ui";
import type { FiscalYearOption } from "./OkrSheetTypes";

interface CreateObjectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; description: string; fiscalYearId: number; status: string }) => Promise<void>;
  fiscalYears: FiscalYearOption[];
}

export function CreateObjectiveModal({ isOpen, onClose, onSave, fiscalYears }: CreateObjectiveModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    fiscalYearId: "",
    status: "ACTIVE",
  });

  // Auto-select first fiscal year when modal opens
  useEffect(() => {
    if (isOpen && fiscalYears.length > 0 && !formData.fiscalYearId) {
      setFormData((prev) => ({ ...prev, fiscalYearId: String(fiscalYears[0].id) }));
    }
  }, [isOpen, fiscalYears, formData.fiscalYearId]);

  const handleSave = async () => {
    // Validation
    if (!formData.title.trim()) {
      toast({ variant: "warning", title: "Titolo richiesto", description: "Inserisci un titolo per l'obiettivo" });
      return;
    }
    if (!formData.fiscalYearId) {
      toast({ variant: "warning", title: "Anno fiscale richiesto", description: "Seleziona un anno fiscale" });
      return;
    }

    setSaving(true);
    try {
      await onSave({
        title: formData.title,
        description: formData.description,
        fiscalYearId: Number(formData.fiscalYearId),
        status: formData.status,
      });
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        fiscalYearId: fiscalYears.length > 0 ? String(fiscalYears[0].id) : "",
        status: "ACTIVE",
      });
      
      onClose();
    } catch (error) {
      console.error("Error saving objective:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setFormData({
        title: "",
        description: "",
        fiscalYearId: fiscalYears.length > 0 ? String(fiscalYears[0].id) : "",
        status: "ACTIVE",
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Crea Nuovo Obiettivo" size="lg">
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-primary)]">
            Titolo <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Es: Aumentare la brand awareness"
            disabled={saving}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-primary)]">Descrizione</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descrizione dettagliata dell'obiettivo..."
            disabled={saving}
            rows={4}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--color-primary)] placeholder:text-[var(--color-neutral-400)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]"
          />
        </div>

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
          <label className="mb-2 block text-sm font-medium text-[var(--color-primary)]">Stato</label>
          <Select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            disabled={saving}
          >
            <option value="ACTIVE">Attivo</option>
            <option value="COMPLETED">Completato</option>
            <option value="ARCHIVED">Archiviato</option>
          </Select>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvataggio..." : "Crea Obiettivo"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

