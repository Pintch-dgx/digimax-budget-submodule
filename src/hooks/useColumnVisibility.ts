"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

export interface ColumnConfig {
  id: string;
  label: string;
  defaultVisible?: boolean;
}

const STORAGE_PREFIX = "table-columns-";
const ORDER_PREFIX = "table-column-order-";

interface ColumnPreferences {
  visible: string[];
  order: string[];
}

/**
 * Hook per gestire la visibilità e l'ordine delle colonne di una tabella
 * Salva le preferenze in localStorage con una chiave specifica per ogni tabella
 */
export function useColumnVisibility(tableId: string, columns: ColumnConfig[]) {
  const storageKey = `${STORAGE_PREFIX}${tableId}`;
  const orderKey = `${ORDER_PREFIX}${tableId}`;

  // Determina le colonne visibili e l'ordine iniziali (da localStorage o default)
  const getInitialState = useCallback((): { visible: Set<string>; order: string[] } => {
    if (typeof window === "undefined") {
      // SSR: usa i default
      const defaultVisible = columns.filter((col) => col.defaultVisible !== false).map((col) => col.id);
      return {
        visible: new Set(defaultVisible),
        order: columns.map((col) => col.id),
      };
    }

    try {
      const storedVisible = localStorage.getItem(storageKey);
      const storedOrder = localStorage.getItem(orderKey);

      let visibleSet: Set<string>;
      if (storedVisible) {
        const parsed = JSON.parse(storedVisible) as string[];
        const validColumns = parsed.filter((id) => columns.some((col) => col.id === id));
        visibleSet = validColumns.length > 0 ? new Set(validColumns) : new Set(columns.filter((col) => col.defaultVisible !== false).map((col) => col.id));
      } else {
        visibleSet = new Set(columns.filter((col) => col.defaultVisible !== false).map((col) => col.id));
      }

      let orderArray: string[];
      if (storedOrder) {
        const parsed = JSON.parse(storedOrder) as string[];
        // Mantieni solo le colonne che esistono ancora, aggiungi quelle mancanti alla fine
        const validOrder = parsed.filter((id) => columns.some((col) => col.id === id));
        const missingColumns = columns.filter((col) => !validOrder.includes(col.id)).map((col) => col.id);
        orderArray = [...validOrder, ...missingColumns];
      } else {
        orderArray = columns.map((col) => col.id);
      }

      return { visible: visibleSet, order: orderArray };
    } catch (error) {
      console.warn(`Failed to load column preferences for ${tableId}:`, error);
      const defaultVisible = columns.filter((col) => col.defaultVisible !== false).map((col) => col.id);
      return {
        visible: new Set(defaultVisible),
        order: columns.map((col) => col.id),
      };
    }
  }, [storageKey, orderKey, columns]);

  const initialState = getInitialState();
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(initialState.visible);
  const [columnOrder, setColumnOrder] = useState<string[]>(initialState.order);

  // Salva le preferenze quando cambiano
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const visibleArray = Array.from(visibleColumns);
      localStorage.setItem(storageKey, JSON.stringify(visibleArray));
      localStorage.setItem(orderKey, JSON.stringify(columnOrder));
    } catch (error) {
      console.warn(`Failed to save column preferences for ${tableId}:`, error);
    }
  }, [storageKey, orderKey, tableId, visibleColumns, columnOrder]);

  // Sincronizza quando le colonne cambiano (es. aggiunta di nuove colonne)
  useEffect(() => {
    setVisibleColumns((prev) => {
      const updated = new Set(prev);
      let changed = false;

      prev.forEach((id) => {
        if (!columns.some((col) => col.id === id)) {
          updated.delete(id);
          changed = true;
        }
      });

      columns.forEach((col) => {
        if (col.defaultVisible !== false && !updated.has(col.id)) {
          updated.add(col.id);
          changed = true;
        }
      });

      return changed ? updated : prev;
    });

    setColumnOrder((prev) => {
      const validOrder = prev.filter((id) => columns.some((col) => col.id === id));
      const missingColumns = columns.filter((col) => !validOrder.includes(col.id)).map((col) => col.id);
      return missingColumns.length > 0 ? [...validOrder, ...missingColumns] : prev;
    });
  }, [columns]);

  const toggleColumn = useCallback((columnId: string) => {
    setVisibleColumns((prev) => {
      const updated = new Set(prev);
      if (updated.has(columnId)) {
        if (updated.size > 1) {
          updated.delete(columnId);
        }
      } else {
        updated.add(columnId);
      }
      return updated;
    });
  }, []);

  const showColumn = useCallback((columnId: string) => {
    setVisibleColumns((prev) => {
      if (prev.has(columnId)) return prev;
      const updated = new Set(prev);
      updated.add(columnId);
      return updated;
    });
  }, []);

  const hideColumn = useCallback((columnId: string) => {
    setVisibleColumns((prev) => {
      if (prev.size <= 1) return prev;
      if (!prev.has(columnId)) return prev;
      const updated = new Set(prev);
      updated.delete(columnId);
      return updated;
    });
  }, []);

  const reorderColumns = useCallback((fromIndex: number, toIndex: number) => {
    setColumnOrder((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setVisibleColumns(new Set(columns.filter((col) => col.defaultVisible !== false).map((col) => col.id)));
    setColumnOrder(columns.map((col) => col.id));
  }, [columns]);

  const isColumnVisible = useCallback((columnId: string) => visibleColumns.has(columnId), [visibleColumns]);

  const visibleColumnsArray = useMemo(() => Array.from(visibleColumns), [visibleColumns]);

  // Ordina le colonne visibili secondo l'ordine salvato
  const visibleColumnsConfig = useMemo(() => {
    const visible = columns.filter((col) => visibleColumns.has(col.id));
    // Ordina secondo columnOrder, mantenendo l'ordine di columns per quelle non in columnOrder
    return visible.sort((a, b) => {
      const aIndex = columnOrder.indexOf(a.id);
      const bIndex = columnOrder.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [columns, visibleColumns, columnOrder]);

  // Ordina tutte le colonne secondo l'ordine salvato (per il menu)
  const orderedColumns = useMemo(() => {
    return columns.sort((a, b) => {
      const aIndex = columnOrder.indexOf(a.id);
      const bIndex = columnOrder.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [columns, columnOrder]);

  return {
    visibleColumns,
    visibleColumnsArray,
    visibleColumnsConfig,
    orderedColumns,
    columnOrder,
    toggleColumn,
    showColumn,
    hideColumn,
    reorderColumns,
    resetToDefaults,
    isColumnVisible,
  };
}

