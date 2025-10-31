"use client";

import { useState, useEffect } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui";
import { Button } from "@/components/ui";
import { BudgetRequestStatus } from "@prisma/client";

type BudgetRequest = {
  id: number;
  title: string;
  amount: number;
  dueDate: string;
  status: BudgetRequestStatus;
  notes: string | null;
  requester: {
    id: number;
    fullName: string;
    email: string;
  };
  fiscalYear: {
    id: number;
    code: string;
    label: string;
  };
  createdAt: string;
  updatedAt: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("it-IT", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusLabel(status: BudgetRequestStatus): string {
  const labels: Partial<Record<BudgetRequestStatus, string>> = {
    PENDING_APPROVAL: "In Attesa",
    APPROVED: "Approvata",
    REJECTED: "Rifiutata",
    DRAFT: "Bozza",
  };
  return labels[status] || status;
}

function getStatusColor(status: BudgetRequestStatus): string {
  const colors: Partial<Record<BudgetRequestStatus, string>> = {
    PENDING_APPROVAL: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
    APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300",
    REJECTED: "bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-300",
    DRAFT: "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300",
  };
  return colors[status] || "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300";
}

export function BudgetRequestsList() {
  const [requests, setRequests] = useState<BudgetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/budget-requests", {
        credentials: "include",
        cache: "no-store",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        const errorMsg = errorData.error || errorData.details || `HTTP ${response.status}: Failed to fetch budget requests`;
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      setRequests(data);
    } catch (err) {
      console.error("Error fetching budget requests:");
      console.error("Error name:", err instanceof Error ? err.name : typeof err);
      console.error("Error constructor:", err instanceof Error ? err.constructor.name : "N/A");
      console.error("Error message:", err instanceof Error ? err.message : String(err));
      console.error("Full error:", err);
      
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-slate-500 dark:text-slate-400">Caricamento...</div>;
  }

  if (error) {
    return (
      <div className="rounded-md bg-rose-50 p-4 text-sm text-rose-800 dark:bg-rose-900/20 dark:text-rose-300">
        Errore: {error}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500 dark:text-slate-400">
        Nessuna richiesta budget trovata. Crea la tua prima richiesta!
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titolo</TableHead>
          <TableHead>Richiedente</TableHead>
          <TableHead className="text-right">Importo</TableHead>
          <TableHead>Scadenza</TableHead>
          <TableHead>Stato</TableHead>
          <TableHead>Anno Fiscale</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell className="font-medium">{request.title}</TableCell>
            <TableCell>{request.requester.fullName}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(request.amount)}</TableCell>
            <TableCell>{formatDate(request.dueDate)}</TableCell>
            <TableCell>
              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(request.status)}`}>
                {getStatusLabel(request.status)}
              </span>
            </TableCell>
            <TableCell>{request.fiscalYear.code}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

