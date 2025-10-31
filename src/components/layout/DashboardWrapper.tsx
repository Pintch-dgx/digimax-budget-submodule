"use client";

import { DashboardLayout } from "./DashboardLayout";

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export function DashboardWrapper({ children }: DashboardWrapperProps) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

