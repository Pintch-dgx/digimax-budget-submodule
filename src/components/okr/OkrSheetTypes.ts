export type ObjectiveOption = {
  id: number;
  title: string;
  description?: string | null;
  priority?: number | null;
  goalType?: string | null;
  fiscalYearId?: number | null;
};

export type QuarterSprintOption = {
  id: number;
  name: string;
  code: string | null;
  shortCode: string | null;
  quarter: number;
  objectiveSummary?: string | null;
  objective: {
    id: number;
    title: string;
    description: string | null;
    status: string;
  } | null;
  startDate: string | null;
  endDate: string | null;
  fiscalYearId: number | null;
  objectiveId?: number | null;
  counts?: {
    campaigns: number;
    keyResults: number;
    budgetRequests: number;
  };
};

export type KeyResultOption = {
  id: number;
  title: string;
  metric: string;
  targetValue: number;
  progressValue?: number | null;
  unit?: string | null;
  weight?: number;
  status?: string;
  campaignId: number | null;
  ownerId?: number | null;
};

export type FiscalYearOption = {
  id: number;
  code: string;
  label: string;
};

