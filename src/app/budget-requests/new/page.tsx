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
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const requestData = {
      title,
      amount: parseFloat(amount),
      dueDate,
      notes: notes || null,
    };
    
    console.log("Submitting budget request:", requestData);

    try {
      const response = await fetch("/api/budget-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      });
      
      console.log("Response status:", response.status, response.statusText);

      if (!response.ok) {
        let data: any = {};
        const responseText = await response.text();
        console.error("Raw response text:", responseText);
        
        try {
          if (responseText) {
            data = JSON.parse(responseText);
          }
        } catch (e) {
          console.error("Failed to parse JSON:", e);
          data = { error: `HTTP ${response.status}: ${response.statusText}`, raw: responseText };
        }
        
        console.error("Error response data:", data);
        console.error("Response status:", response.status, response.statusText);
        
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

      const result = await response.json();
      console.log("Budget request created successfully:", result);
      router.push("/budget-requests");
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
    }
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
                <label htmlFor="dueDate" className="mb-2 block text-sm font-medium">
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

              {error && (
                <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-900/20 dark:text-rose-300">
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

