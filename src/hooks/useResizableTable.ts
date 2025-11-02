"use client";

import { RefObject, useEffect } from "react";

interface ResizableTableOptions {
  minWidth?: number;
  tableId?: string;
  userId?: string;
}

const DEFAULT_MIN_WIDTH = 16;

function getStorageKey(userId?: string, tableId?: string): string | null {
  if (!userId || !tableId) return null;
  return `table-widths-${userId}-${tableId}`;
}

function loadColumnWidths(userId?: string, tableId?: string): number[] | null {
  const key = getStorageKey(userId, tableId);
  if (!key || typeof window === "undefined") return null;
  
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function saveColumnWidths(widths: number[], userId?: string, tableId?: string): void {
  const key = getStorageKey(userId, tableId);
  if (!key || typeof window === "undefined") return;
  
  try {
    localStorage.setItem(key, JSON.stringify(widths));
  } catch {
    // Ignore storage errors
  }
}

export function useResizableTable(
  tableRef: RefObject<HTMLTableElement>,
  enabled = true,
  options?: ResizableTableOptions
) {
  useEffect(() => {
    const table = tableRef.current;
    if (!enabled || !table) return;

    if (table.dataset.resizableInitialized === "true") {
      return;
    }

    const headRow = table.querySelector("thead tr");
    if (!headRow) return;

    const headerCells = Array.from(headRow.children).filter(
      (cell): cell is HTMLTableCellElement => cell instanceof HTMLTableCellElement
    );
    if (headerCells.length === 0) {
      return;
    }

    const minWidth = Math.max(options?.minWidth ?? DEFAULT_MIN_WIDTH, 4);

    // Load saved widths BEFORE initializing
    const savedWidths = loadColumnWidths(options?.userId, options?.tableId);

    table.style.tableLayout = table.style.tableLayout || "fixed";
    table.dataset.resizableInitialized = "true";

    let colgroup = table.querySelector("colgroup[data-resizable]");
    if (!colgroup) {
      colgroup = document.createElement("colgroup");
      colgroup.setAttribute("data-resizable", "true");
      headerCells.forEach(() => {
        const col = document.createElement("col");
        colgroup!.appendChild(col);
      });
      table.insertBefore(colgroup, table.firstChild);
    }

    const cols = Array.from(colgroup.querySelectorAll("col"));
    if (cols.length < headerCells.length) {
      for (let i = cols.length; i < headerCells.length; i += 1) {
        const col = document.createElement("col");
        colgroup.appendChild(col);
        cols.push(col);
      }
    }

    const cleanupHandles: Array<() => void> = [];
    const state: {
      index: number;
      startX: number;
      startWidth: number;
    } | null = null;
    const stateRef = { current: state } as { current: typeof state };

    const handlePointerMove = (event: PointerEvent) => {
      const current = stateRef.current;
      if (!current) return;
      const delta = event.clientX - current.startX;
      const next = Math.max(minWidth, current.startWidth + delta);
      const col = cols[current.index];
      const th = headerCells[current.index];
      col.style.width = `${next}px`;
      th.style.width = `${next}px`;
    };

    const handlePointerUp = () => {
      // Save column widths after resize
      const widths = cols.map(col => col.getBoundingClientRect().width);
      saveColumnWidths(widths, options?.userId, options?.tableId);
      
      stateRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
    
    headerCells.forEach((th, index) => {
      let initialWidth: number;
      
      if (savedWidths && savedWidths[index] !== undefined && savedWidths[index] !== null) {
        initialWidth = savedWidths[index];
      } else {
        initialWidth = th.getBoundingClientRect().width || cols[index].getBoundingClientRect().width || 120;
      }
      
      const finalWidth = Math.max(minWidth, initialWidth);
      cols[index].style.width = `${finalWidth}px`;
      th.style.width = `${finalWidth}px`;
      th.style.position = th.style.position || "relative";

      const handle = document.createElement("span");
      handle.dataset.resizerHandle = "true";
      handle.style.position = "absolute";
      handle.style.top = "0";
      handle.style.right = "0";
      handle.style.height = "100%";
      handle.style.width = "8px";
      handle.style.cursor = "col-resize";
      handle.style.touchAction = "none";
      handle.style.userSelect = "none";

      const inner = document.createElement("span");
      inner.style.position = "absolute";
      inner.style.top = "50%";
      inner.style.left = "50%";
      inner.style.transform = "translate(-50%, -50%)";
      inner.style.width = "2px";
      inner.style.height = "50%";
      inner.style.backgroundColor = "var(--color-neutral-300)";
      inner.style.opacity = "0";
      inner.style.transition = "opacity 0.2s";
      handle.appendChild(inner);

      th.addEventListener("pointerenter", () => {
        inner.style.opacity = "1";
      });
      th.addEventListener("pointerleave", () => {
        inner.style.opacity = "0";
      });

      const handlePointerDown = (event: PointerEvent) => {
        event.preventDefault();
        event.stopPropagation();
        handle.setPointerCapture(event.pointerId);
        stateRef.current = {
          index,
          startX: event.clientX,
          startWidth: cols[index].getBoundingClientRect().width,
        };
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp, { once: true });
      };

      handle.addEventListener("pointerdown", handlePointerDown);
      th.appendChild(handle);

      cleanupHandles.push(() => {
        handle.removeEventListener("pointerdown", handlePointerDown);
        handle.remove();
      });
    });

    return () => {
      cleanupHandles.forEach((cleanup) => cleanup());
      table.removeAttribute("data-resizable-initialized");
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [tableRef, enabled, options?.minWidth, options?.tableId, options?.userId]);
}
