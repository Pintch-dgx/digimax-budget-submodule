"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Button,
  Skeleton,
  Badge,
  useToast,
} from "@/components/ui";
import { BudgetRequestLinkStatus, BudgetRequestStatus } from "@prisma/client";

type BudgetRequest = {
  id: number;
  title: string;
  amount: number;
  dueDate: string;
  status: BudgetRequestStatus;
  linkStatus: BudgetRequestLinkStatus;
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
  campaign: {
    id: number;
    name: string;
  } | null;
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

function getStatusBadge(status: BudgetRequestStatus) {
  const map: Record<BudgetRequestStatus, { label: string; variant: Parameters<typeof Badge>[0]["variant"] }> = {
    [BudgetRequestStatus.PENDING_APPROVAL]: { label: "Attesa", variant: "warning" },
    [BudgetRequestStatus.APPROVED]: { label: "Approv.", variant: "success" },
    [BudgetRequestStatus.APPROVED_WITH_CHANGES]: { label: "Approv. mod.", variant: "success" },
    [BudgetRequestStatus.REJECTED]: { label: "Rifiut.", variant: "danger" },
    [BudgetRequestStatus.DRAFT]: { label: "Bozza", variant: "info" },
  };
  return map[status] ?? { label: status, variant: "default" };
}

function getLinkStatusBadge(linkStatus: BudgetRequestLinkStatus) {
  const map: Record<
    BudgetRequestLinkStatus,
    { label: string; variant: Parameters<typeof Badge>[0]["variant"] }
  > = {
    [BudgetRequestLinkStatus.UNDEFINED_OBJECTIVE]: { label: "No OKR", variant: "info" as const },
    [BudgetRequestLinkStatus.ASSIGNMENT_PENDING]: { label: "Da assegnare", variant: "warning" },
    [BudgetRequestLinkStatus.ASSIGNED_TO_CAMPAIGN]: { label: "Collegata", variant: "success" },
  };

  return map[linkStatus] ?? { label: linkStatus, variant: "default" };
}

export function ApprovalsList({ onChange }: { onChange?: () => void } = {}) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<BudgetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchPendingRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/budget-requests?status=PENDING_APPROVAL&page=1&pageSize=50", {
        credentials: "include",
        cache: "no-store",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || errorData.details || "Failed to fetch pending requests");
      }
      
      const { data }: { data: BudgetRequest[] } = await response.json();
      setRequests(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      toast({ variant: "error", title: "Errore caricamento", description: message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const handleApprove = async (requestId: number, overrideAmount?: number) => {
    setProcessingId(requestId);
    try {
      const payload: Record<string, unknown> = {
        status: overrideAmount !== undefined
          ? BudgetRequestStatus.APPROVED_WITH_CHANGES
          : BudgetRequestStatus.APPROVED,
      };
      if (overrideAmount !== undefined) {
        payload.approvedAmount = overrideAmount;
      }

      const response = await fetch(`/api/budget-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve request");
      }

      toast({
        variant: "success",
        title: overrideAmount !== undefined ? "Richiesta approvata con modifica" : "Richiesta approvata",
      });

      // Ricarica la lista
      await fetchPendingRequests();
      onChange?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast({ variant: "error", title: "Errore", description: message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveWithChanges = (request: BudgetRequest) => {
    const input = window.prompt(
      `Importo richiesto: €${request.amount}\nInserisci importo approvato (diverso da richiesto):`,
      String(request.amount)
    );
    if (input === null) return;
    const parsed = Number(input);
    if (Number.isNaN(parsed) || parsed <= 0) {
      toast({ variant: "error", title: "Importo non valido" });
      return;
    }
    handleApprove(request.id, parsed);
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

      toast({ variant: "success", title: "Richiesta rifiutata" });

      // Ricarica la lista
      await fetchPendingRequests();
      onChange?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast({ variant: "error", title: "Errore", description: message });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titolo</TableHead>
            <TableHead>Richiedente</TableHead>
            <TableHead className="text-right">Importo</TableHead>
            <TableHead>Scadenza</TableHead>
            <TableHead>Stato</TableHead>
            <TableHead>Collegamento</TableHead>
            <TableHead>Anno Fiscale</TableHead>
            <TableHead className="text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 4 }).map((_, index) => (
            <TableRow key={`skeleton-${index}`}>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-8 w-24" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (error) {
    return (
      <div className="rounded-[var(--radius-md)] bg-rose-50 p-4 text-sm text-rose-800 shadow-[var(--shadow-sm)] dark:bg-[#3b1414] dark:text-[#ffb3ac]">
        Errore: {error}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface)]/90 py-8 text-center text-[var(--color-neutral-500)] shadow-[var(--shadow-md)] dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]">
        Nessuna richiesta in attesa di approvazione.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)] bg-[var(--surface)] shadow-[var(--shadow-md)] dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titolo</TableHead>
            <TableHead>Richiedente</TableHead>
            <TableHead className="text-right">Importo</TableHead>
            <TableHead>Scadenza</TableHead>
            <TableHead>Stato</TableHead>
            <TableHead>Collegamento</TableHead>
            <TableHead>Anno Fiscale</TableHead>
            <TableHead className="text-right">Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => {
            const statusBadge = getStatusBadge(request.status);
            const linkBadge = getLinkStatusBadge(request.linkStatus);
            return (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.title}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{request.requester.fullName}</span>
                    <span className="text-xs text-[var(--color-neutral-500)]">{request.requester.email}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(request.amount)}</TableCell>
                <TableCell>{formatDate(request.dueDate)}</TableCell>
                <TableCell>
                  <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant={linkBadge.variant}>{linkBadge.label}</Badge>
                    {request.campaign ? (
                      <span className="text-xs text-[var(--color-neutral-500)]">Campagna: {request.campaign.name}</span>
                    ) : request.linkStatus === BudgetRequestLinkStatus.ASSIGNMENT_PENDING ? (
                      <span className="text-xs text-[var(--color-neutral-500)]">In attesa di associare una campagna</span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-[var(--color-primary)] dark:text-[var(--color-neutral-800)]">{request.fiscalYear.code}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApproveWithChanges(request)}
                      disabled={processingId === request.id}
                      className="min-w-[38px] px-3"
                      aria-label="Approva con modifica importo"
                      title="Approva con modifica importo"
                    >
                      €
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(request.id)}
                      disabled={processingId === request.id}
                      className="min-w-[38px] px-3"
                      aria-label="Approva richiesta"
                      title="Approva"
                    >
                      {processingId === request.id ? (
                        <span>...</span>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(request.id)}
                      disabled={processingId === request.id}
                      className="min-w-[38px] px-3"
                      aria-label="Rifiuta richiesta"
                      title="Rifiuta"
                    >
                      {processingId === request.id ? (
                        <span>...</span>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
