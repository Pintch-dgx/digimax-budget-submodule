"use client";

import { useState, useEffect } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui";
import { Button } from "@/components/ui";
import { BudgetRequestStatus } from "@prisma/client";
import { useRouter } from "next/navigation";

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

export function ApprovalsList() {
  const router = useRouter();
  const [requests, setRequests] = useState<BudgetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/budget-requests?status=PENDING_APPROVAL", {
        credentials: "include",
        cache: "no-store",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || errorData.details || "Failed to fetch pending requests");
      }
      
      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    setProcessingId(requestId);
    try {
      const response = await fetch(`/api/budget-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          status: BudgetRequestStatus.APPROVED,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve request");
      }

      // Ricarica la lista
      await fetchPendingRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    if (!confirm("Sei sicuro di voler rifiutare questa richiesta?")) {
      return;
    }

    setProcessingId(requestId);
    try {
      const response = await fetch(`/api/budget-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          status: BudgetRequestStatus.REJECTED,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reject request");
      }

      // Ricarica la lista
      await fetchPendingRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setProcessingId(null);
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
        Nessuna richiesta in attesa di approvazione.
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
          <TableHead>Anno Fiscale</TableHead>
          <TableHead className="text-right">Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell className="font-medium">{request.title}</TableCell>
            <TableCell>{request.requester.fullName}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(request.amount)}</TableCell>
            <TableCell>{formatDate(request.dueDate)}</TableCell>
            <TableCell>{request.fiscalYear.code}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleApprove(request.id)}
                  disabled={processingId === request.id}
                >
                  {processingId === request.id ? "..." : "Approva"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReject(request.id)}
                  disabled={processingId === request.id}
                >
                  {processingId === request.id ? "..." : "Rifiuta"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

