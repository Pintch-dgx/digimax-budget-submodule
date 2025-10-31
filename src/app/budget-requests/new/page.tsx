"use client";

import { DashboardWrapper } from "@/components/layout/DashboardWrapper";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Button, Input } from "@/components/ui";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewBudgetRequestPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementare chiamata API per creare richiesta
    alert("Funzionalità in sviluppo. La richiesta verrà salvata nel database.");
    router.push("/budget-requests");
  };

  return (
    <DashboardWrapper>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold">Nuova Richiesta Budget</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Compila il modulo per creare una nuova richiesta di budget.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Crea Richiesta Budget</CardTitle>
            <CardDescription>Compila tutti i campi richiesti per inviare la richiesta.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="mb-2 block text-sm font-medium">
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
                <label htmlFor="amount" className="mb-2 block text-sm font-medium">
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
                <label htmlFor="notes" className="mb-2 block text-sm font-medium">
                  Note
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Descrizione dettagliata della richiesta..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 dark:border-slate-700 dark:bg-slate-800"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" variant="primary">
                  Crea Richiesta
                </Button>
                <Button type="button" variant="ghost" onClick={() => router.back()}>
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

