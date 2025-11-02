"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { cn } from "@/lib/utils";
import type { ColumnConfig } from "@/hooks/useColumnVisibility";

interface ColumnSelectorProps {
  columns: ColumnConfig[];
  visibleColumns: Set<string>;
  orderedColumns: ColumnConfig[];
  onToggleColumn: (columnId: string) => void;
  onReorderColumns: (fromIndex: number, toIndex: number) => void;
  onReset: () => void;
  tableId: string;
}

export function ColumnSelector({
  columns,
  visibleColumns,
  orderedColumns,
  onToggleColumn,
  onReorderColumns,
  onReset,
}: ColumnSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Chiudi il dropdown quando si clicca fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const visibleCount = visibleColumns.size;
  const totalCount = columns.length;

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    if (draggedIndex !== dropIndex) {
      onReorderColumns(draggedIndex, dropIndex);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
        aria-label="Personalizza colonne"
        aria-expanded={isOpen}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3h18v18H3zM9 9h6v6H9z" />
          <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
        </svg>
        Colonne
        {visibleCount < totalCount && (
          <Badge variant="info" className="ml-1">
            {visibleCount}/{totalCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--surface)] shadow-[var(--shadow-lg)] dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]"
          role="menu"
        >
          <div className="p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]">
                Personalizza colonne
              </h3>
              <button
                onClick={onReset}
                className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] dark:text-[var(--color-tertiary-ice)] dark:hover:text-[var(--color-tertiary-ice)]/80"
              >
                Reimposta
              </button>
            </div>

            <div className="mb-2 text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
              Trascina per riordinare
            </div>

            <div className="max-h-96 space-y-1 overflow-y-auto">
              {orderedColumns.map((column, index) => {
                const isVisible = visibleColumns.has(column.id);
                const isDisabled = isVisible && visibleColumns.size === 1;
                const isDragging = draggedIndex === index;
                const isDragOver = dragOverIndex === index;

                return (
                  <div
                    key={column.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 transition-colors",
                      isDragging && "opacity-50",
                      isDragOver && "bg-[var(--color-primary)]/10 dark:bg-[var(--color-primary)]/20"
                    )}
                    role="menuitem"
                  >
                    {/* Handle drag */}
                    <div
                      className={cn(
                        "cursor-grab text-[var(--color-neutral-400)] hover:text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]/60 dark:hover:text-[var(--color-tertiary-ice)]",
                        isDragging && "cursor-grabbing"
                      )}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="9" y1="3" x2="9" y2="21" />
                        <line x1="15" y1="3" x2="15" y2="21" />
                      </svg>
                    </div>

                    {/* Checkbox */}
                    <label
                      className={cn(
                        "flex flex-1 cursor-pointer items-center gap-2",
                        isDisabled && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => !isDisabled && onToggleColumn(column.id)}
                        disabled={isDisabled}
                        className="h-4 w-4 cursor-pointer rounded border-[var(--color-neutral-300)] text-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] dark:border-[var(--color-neutral-100)]"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="flex-1 text-sm text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]">
                        {column.label}
                      </span>
                    </label>

                    {isDisabled && (
                      <span className="text-[0.65rem] text-[var(--color-neutral-400)] dark:text-[var(--color-tertiary-ice)]/60">
                        Minimo
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 border-t border-[var(--color-neutral-200)] pt-2 dark:border-[var(--color-neutral-100)]">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-primary-dark)]"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

