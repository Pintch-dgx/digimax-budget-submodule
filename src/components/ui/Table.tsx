import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Table({ className, children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn("text-left text-xs uppercase text-slate-500 dark:text-slate-400", className)} {...props}>
      {children}
    </thead>
  );
}

export function TableRow({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn("divide-y divide-slate-200 dark:divide-slate-800", className)} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn("py-2 pr-4 font-medium", className)} {...props}>
      {children}
    </th>
  );
}

export function TableBody({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn("divide-y divide-slate-200 dark:divide-slate-800", className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableCell({ className, children, ...props }: HTMLAttributes<HTMLTableCellElement> & { colSpan?: number }) {
  return (
    <td className={cn("py-3 pr-4", className)} {...props}>
      {children}
    </td>
  );
}

