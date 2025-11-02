"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";

type UpcomingApproval = {
  id: number;
  title: string;
  requester: string;
  requesterEmail: string;
  amount: number;
  dueDate: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: value >= 100000 ? 0 : 2,
  }).format(value);
}

export function ApprovalsCard({ approvals }: { approvals: UpcomingApproval[] }) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  
  // Determina il link di destinazione in base al ruolo
  const handleCardClick = () => {
    window.location.href = isAdmin ? '/approvals' : '/budget-requests';
  };

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full" onClick={handleCardClick}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Approvazioni in arrivo</CardTitle>
            <CardDescription>Azione immediata sulle richieste in attesa.</CardDescription>
          </div>
          {isAdmin && (
            <Link href="/approvals" className="text-xs text-[var(--color-primary)] hover:underline" onClick={(e) => e.stopPropagation()}>
              Vedi tutte →
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {approvals.length > 0 ? (
          <ul className="space-y-4 text-sm" role="list">
            {approvals.map((approval) => {
              const dueDate = new Date(approval.dueDate);
              const daysToDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const dueLabel = dueDate.toLocaleDateString("it-IT", { month: "short", day: "numeric" });
              const urgencyClass =
                daysToDue <= 0
                  ? "bg-[#fde8e7] text-[#b93c35]"
                  : daysToDue <= 3
                    ? "bg-[#fff3cd] text-[#b58900]"
                    : "bg-[var(--color-tertiary-ice)] text-[var(--color-primary)]";

              return (
                <li
                  key={approval.id}
                  className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--surface)]/80 p-4 shadow-[var(--shadow-sm)] dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold text-[var(--color-primary)]">{approval.title}</p>
                      <p className="text-xs text-[var(--color-neutral-500)]">Richiedente: {approval.requester}</p>
                    </div>
                    <span className={cn("rounded-full px-2 py-1 text-xs font-semibold uppercase", urgencyClass)}>
                      {daysToDue <= 0 ? "Scaduta" : `+${daysToDue}g`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-neutral-500)]">
                    <span>Importo: <strong className="text-[var(--color-primary)]">{formatCurrency(approval.amount)}</strong></span>
                    <span>
                      Scadenza <time dateTime={approval.dueDate}>{dueLabel}</time>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={isAdmin ? `/approvals` : `/budget-requests?requestId=${approval.id}`}
                      prefetch={false}
                      className="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--color-primary-dark)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      <span className="hidden sm:inline">{isAdmin ? "Vai alle approvazioni" : "Vai alle richieste"}</span>
                      <span className="sm:hidden">Vai</span>
                    </Link>
                    <a
                      href={`mailto:${approval.requesterEmail}?subject=${encodeURIComponent(`Follow-up richiesta budget: ${approval.title}`)}&body=${encodeURIComponent("Ciao, vorrei un aggiornamento sulla tua richiesta di budget.")}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-tertiary-ice)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      <span className="hidden sm:inline">Invia promemoria</span>
                      <span className="sm:hidden">Email</span>
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-[var(--color-neutral-500)]">Nessuna approvazione in arrivo</p>
        )}
      </CardContent>
    </Card>
  );
}

