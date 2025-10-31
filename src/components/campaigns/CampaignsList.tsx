"use client";

import { useState, useEffect } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui";

type Campaign = {
  id: number;
  name: string;
  goal: string | null;
  status: string;
  channel: {
    id: number;
    name: string;
    slug: string;
  };
  owner: {
    id: number;
    fullName: string;
    email: string;
  };
  allocations: Array<{
    id: number;
    allocated: number;
    spent: number;
    fiscalYear: {
      id: number;
      code: string;
    };
  }>;
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

export function CampaignsList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/campaigns", {
        credentials: "include",
        cache: "no-store",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || errorData.details || "Failed to fetch campaigns");
      }
      
      const data = await response.json();
      setCampaigns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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

  if (campaigns.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500 dark:text-slate-400">
        Nessuna campagna trovata.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Campagna</TableHead>
          <TableHead>Canale</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead className="text-right">Allocato</TableHead>
          <TableHead className="text-right">Speso</TableHead>
          <TableHead className="text-right">Delta</TableHead>
          <TableHead>Anno Fiscale</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {campaigns.map((campaign) => {
          const allocation = campaign.allocations[0];
          const allocated = allocation?.allocated ?? 0;
          const spent = allocation?.spent ?? 0;
          const delta = allocated - spent;
          const deltaColor =
            delta > 0
              ? "text-emerald-600 dark:text-emerald-400"
              : delta < 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-500 dark:text-slate-400";

          return (
            <TableRow key={campaign.id}>
              <TableCell className="font-medium">{campaign.name}</TableCell>
              <TableCell>{campaign.channel.name}</TableCell>
              <TableCell>{campaign.owner.fullName}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(allocated)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(spent)}</TableCell>
              <TableCell className={`text-right tabular-nums ${deltaColor}`}>{formatCurrency(delta)}</TableCell>
              <TableCell>{campaign.fiscalYear.code}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

