export type SummaryMetric = {
  label: string;
  amount: number;
  trend: "up" | "down" | "flat";
  changePercentage: number;
};

export const summaryMetrics: SummaryMetric[] = [
  { label: "Budget Annuale", amount: 2500000, trend: "up", changePercentage: 12.5 },
  { label: "Spesa YTD", amount: 1475000, trend: "down", changePercentage: -4.2 },
  { label: "Disponibile", amount: 1025000, trend: "flat", changePercentage: 0 },
];

export type CampaignAllocation = {
  name: string;
  channel: string;
  owner: string;
  allocated: number;
  spent: number;
};

export const campaignAllocations: CampaignAllocation[] = [
  {
    name: "Brand Refresh Q3",
    channel: "Digital",
    owner: "Laura R.",
    allocated: 320000,
    spent: 185000,
  },
  {
    name: "Evento Clienti Milano",
    channel: "Eventi",
    owner: "Matteo S.",
    allocated: 210000,
    spent: 162000,
  },
  {
    name: "ABM Program",
    channel: "Account-Based Marketing",
    owner: "Francesca L.",
    allocated: 410000,
    spent: 352000,
  },
];

export type UpcomingApproval = {
  title: string;
  requester: string;
  amount: number;
  dueDate: string;
};

export const upcomingApprovals: UpcomingApproval[] = [
  {
    title: "Media plan LinkedIn Q4",
    requester: "Alessandro T.",
    amount: 78000,
    dueDate: "2024-09-18",
  },
  {
    title: "Partnership evento SaaS Summit",
    requester: "Giulia P.",
    amount: 54000,
    dueDate: "2024-09-22",
  },
];

export type Insight = {
  title: string;
  description: string;
};

export const insights: Insight[] = [
  {
    title: "Campagne digital con ROI più alto",
    description:
      "Lead generation SEM + PPC ha un ROI del 165%. Valuta la riallocazione del 5% del budget social verso search.",
  },
  {
    title: "Sottoutilizzo eventi",
    description:
      "Gli eventi hanno il 24% del budget annuale ancora disponibile. Considera attività con partner strategici su Q4.",
  },
];
