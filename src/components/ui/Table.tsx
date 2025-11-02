"use client";

import { HTMLAttributes, useRef } from "react";
import { cn } from "@/lib/utils";
import { useResizableTable } from "@/hooks/useResizableTable";

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  resizable?: boolean;
  minColumnWidth?: number;
  tableId?: string;
  userId?: string;
}

export function Table({ className, children, resizable = true, minColumnWidth, tableId, userId, ...props }: TableProps) {
  const tableRef = useRef<HTMLTableElement>(null);
  useResizableTable(tableRef, resizable, { minWidth: minColumnWidth, tableId, userId });

  return (
    <div className="w-full overflow-x-auto">
      <table
        ref={tableRef}
        className={cn(
          "w-full min-w-full divide-y divide-[var(--color-neutral-200)] text-sm text-[var(--color-primary)] dark:divide-[var(--color-neutral-100)]",
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "bg-[var(--color-neutral-100)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)] dark:bg-[var(--surface)]/60 dark:text-[var(--color-tertiary-ice)]/80",
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableRow({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "divide-y divide-[var(--color-neutral-100)] transition-colors dark:divide-[var(--color-neutral-50)]",
        "hover:bg-[var(--color-tertiary-ice)]/30 dark:hover:bg-[var(--surface-muted)]/60",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }: HTMLAttributes<HTMLTableCellElement> & { filter?: any }) {
  return (
    <th className={cn("py-4 px-5 first:pl-7 font-semibold whitespace-nowrap", className)} {...props}>
      <div className="flex items-center justify-between gap-2">
        <span>{children}</span>
      </div>
    </th>
  );
}

export function TableBody({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn(
        "divide-y divide-[var(--color-neutral-100)] bg-[var(--surface)] dark:divide-[var(--color-neutral-50)] dark:bg-[var(--surface-muted)]",
        className
      )}
      {...props}
    >
      {children}
    </tbody>
  );
}

export function TableCell({ className, children, ...props }: HTMLAttributes<HTMLTableCellElement> & { colSpan?: number }) {
  return (
    <td className={cn("py-5 px-5 first:pl-7 align-top", className)} {...props}>
      <div className="min-w-0">
        {children}
      </div>
    </td>
  );
}

