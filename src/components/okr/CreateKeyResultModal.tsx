"use client";

import { useState, useEffect } from "react";
import { Modal, Input, Select, Button, useToast } from "@/components/ui";

interface QuarterSprintOption {
  id: string;
  name: string;
  objectiveTitle: string;
}

interface CreateKeyResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    metric: string;
    quarterSprintId: number;
    targetValue: number;
    progressValue: number;
    weight: number;
    unit: string;
    ownerId: number | null;
  }) => Promise<void>;
  quarterSprints: QuarterSprintOption[];
  currentUserId: number | null;
}

export function CreateKeyResultModal({
  isOpen,
  onClose,
  onSave,
  quarterSprints,
  currentUserId,
}: CreateKeyResultModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    metric: "",
    quarterSprintId: "",
    targetValue: "",
    progressValue: "0",
    weight: "1",
    unit: "",
  });

  // Auto-select first quarter sprint when modal opens
  useEffect(() => {
    if (isOpen && quarterSprints.length > 0 && !formData.quarterSprintId) {
      setFormData((prev) => ({ ...prev, quarterSprintId: String(quarterSprints[0].id) }));
    }
  }, [isOpen, quarterSprints, formData.quarterSprintId]);

  const handleSave = async () => {
    // Validation
    if (!formData.title.trim()) {
      toast({ variant: "warning", title: "Titolo richiesto", description: "Inserisci un titolo per il Key Result" });
      return;
    }
    if (!formData.metric.trim()) {
      toast({ variant: "warning", title: "Metrica richiesta", description: "Inserisci una metrica di misurazione" });
      return;
    }
    if (!formData.quarterSprintId) {
      toast({
        variant: "warning",
        title: "Quarter Sprint richiesto",
        description: "Seleziona un Quarter Sprint per il Key Result",
      });
      return;
    }
    if (!formData.targetValue.trim() || Number(formData.targetValue) <= 0) {
      toast({
        variant: "warning",
        title: "Target non valido",
        description: "Inserisci un valore target positivo",
      });
      return;
    }

    const parsedTarget = Number(formData.targetValue);
    const parsedProgress = Number(formData.progressValue);
    const parsedWeight = Number(formData.weight);

    if (isNaN(parsedTarget) || isNaN(parsedProgress) || isNaN(parsedWeight)) {
      toast({
        variant: "warning",
        title: "Valori non validi",
        description: "Assicurati che tutti i valori numerici siano corretti",
      });
      return;
    }

    setSaving(true);
    try {
      await onSave({
        title: formData.title,
        metric: formData.metric,
        quarterSprintId: Number(formData.quarterSprintId),
        targetValue: parsedTarget,
        progressValue: parsedProgress,
        weight: parsedWeight,
        unit: formData.unit || "unit",
        ownerId: currentUserId,
      });

      // Reset form
      setFormData({
        title: "",
        metric: "",
        quarterSprintId: quarterSprints.length > 0 ? String(quarterSprints[0].id) : "",
        targetValue: "",
        progressValue: "0",
        weight: "1",
        unit: "",
      });

      onClose();
    } catch (error) {
      console.error("Error saving key result:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setFormData({
        title: "",
        metric: "",
        quarterSprintId: quarterSprints.length > 0 ? String(quarterSprints[0].id) : "",
        targetValue: "",
        progressValue: "0",
        weight: "1",
        unit: "",
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Crea Nuovo Key Result" size="lg">
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-primary)]">
            Titolo <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Es: Aumentare traffico organico del 30%"
            disabled={saving}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-primary)]">
            Metrica <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.metric}
            onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
            placeholder="Es: Visite mensili, Conversioni, CTR"
            disabled={saving}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-primary)]">
            Quarter Sprint <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.quarterSprintId}
            onChange={(e) => setFormData({ ...formData, quarterSprintId: e.target.value })}
            disabled={saving || quarterSprints.length === 0}
          >
            {quarterSprints.length === 0 ? (
              <option value="">Nessun Quarter Sprint disponibile</option>
            ) : (
              quarterSprints.map((qs) => (
                <option key={qs.id} value={qs.id}>
                  {qs.name} - {qs.objectiveTitle}
                </option>
              ))
            )}
          </Select>
          {quarterSprints.length === 0 && (
            <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
              Crea prima un Quarter Sprint dal tab "Quarter Sprint"
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-primary)]">
              Target <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="any"
              min="0"
              value={formData.targetValue}
              onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
              placeholder="100"
              disabled={saving}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-primary)]">Unità di Misura</label>
            <Input
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="Es: %, €, clicks, visualizzazioni"
              disabled={saving}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-primary)]">Progresso</label>
            <Input
              type="number"
              step="any"
              min="0"
              value={formData.progressValue}
              onChange={(e) => setFormData({ ...formData, progressValue: e.target.value })}
              placeholder="0"
              disabled={saving}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-primary)]">Peso</label>
            <Input
              type="number"
              step="any"
              min="0"
              max="10"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="1"
              disabled={saving}
            />
          </div>
        </div>

        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            💡 <strong>Suggerimento:</strong> Il peso determina l'importanza relativa di questo Key Result rispetto
            agli altri nel Quarter Sprint. Valori più alti indicano maggiore priorità.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvataggio..." : "Crea Key Result"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

