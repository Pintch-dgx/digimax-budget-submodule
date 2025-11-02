"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Select } from "./Select";
import { cn } from "@/lib/utils";

export type FilterType = "text" | "number" | "date" | "select" | "boolean";

export interface ColumnFilter {
  type: FilterType;
  options?: Array<{ value: string; label: string }>; // Per select
  getValue?: (row: any) => any; // Funzione per estrarre il valore dalla riga
}

interface ColumnFilterProps {
  columnId: string;
  label: string;
  filter?: ColumnFilter;
  value: any;
  onChange: (value: any) => void;
  onClear: () => void;
}

export function ColumnFilter({ columnId, label, filter, value, onChange, onClear }: ColumnFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("contains");
  const [filterValue, setFilterValue] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      if (typeof value === "object" && value.operator) {
        setFilterType(value.operator);
        setFilterValue(value.value ?? "");
      } else {
        setFilterValue(String(value ?? ""));
      }
    } else {
      setFilterValue("");
      setFilterType("contains");
    }
  }, [value]);

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

  if (!filter) return null;

  const handleApply = () => {
    if (filter.type === "text") {
      if (filterValue.trim()) {
        onChange({
          operator: filterType,
          value: filterValue.trim(),
        });
      } else {
        onClear();
      }
    } else if (filter.type === "number") {
      const numValue = Number(filterValue);
      if (!isNaN(numValue) && filterValue !== "") {
        onChange({
          operator: filterType,
          value: numValue,
        });
      } else {
        onClear();
      }
    } else if (filter.type === "select") {
      if (filterValue) {
        onChange(filterValue);
      } else {
        onClear();
      }
    } else if (filter.type === "boolean") {
      if (filterValue !== "") {
        onChange(filterValue === "true");
      } else {
        onClear();
      }
    } else if (filter.type === "date") {
      if (filterValue) {
        onChange(filterValue);
      } else {
        onClear();
      }
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setFilterValue("");
    setFilterType("contains");
    onClear();
    setIsOpen(false);
  };

  const isFiltered = value !== null && value !== undefined && value !== "";

  return (
    <div className="relative inline-flex" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "ml-1 inline-flex items-center justify-center rounded p-1 text-[var(--color-neutral-400)] transition-colors hover:text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]/60 dark:hover:text-[var(--color-tertiary-ice)]",
          isFiltered && "text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]"
        )}
        aria-label={`Filtra ${label}`}
        aria-expanded={isOpen}
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
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-64 rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--surface)] shadow-[var(--shadow-lg)] dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]"
          role="menu"
        >
          <div className="p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]">
                Filtra {label}
              </h3>
              {isFiltered && (
                <button
                  onClick={handleClear}
                  className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] dark:text-[var(--color-tertiary-ice)] dark:hover:text-[var(--color-tertiary-ice)]/80"
                >
                  Cancella
                </button>
              )}
            </div>

            <div className="space-y-3">
              {filter.type === "text" && (
                <>
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full text-sm"
                  >
                    <option value="contains">Contiene</option>
                    <option value="equals">Uguale a</option>
                    <option value="startsWith">Inizia con</option>
                    <option value="endsWith">Finisce con</option>
                  </Select>
                  <Input
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    placeholder="Inserisci testo..."
                    className="w-full text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleApply();
                      }
                    }}
                  />
                </>
              )}

              {filter.type === "number" && (
                <>
                  <Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full text-sm"
                  >
                    <option value="equals">Uguale a</option>
                    <option value="greaterThan">Maggiore di</option>
                    <option value="lessThan">Minore di</option>
                    <option value="greaterThanOrEqual">Maggiore o uguale a</option>
                    <option value="lessThanOrEqual">Minore o uguale a</option>
                  </Select>
                  <Input
                    type="number"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    placeholder="Inserisci numero..."
                    className="w-full text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleApply();
                      }
                    }}
                  />
                </>
              )}

              {filter.type === "select" && filter.options && (
                <Select
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="w-full text-sm"
                >
                  <option value="">Tutti</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              )}

              {filter.type === "boolean" && (
                <Select
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="w-full text-sm"
                >
                  <option value="">Tutti</option>
                  <option value="true">Sì</option>
                  <option value="false">No</option>
                </Select>
              )}

              {filter.type === "date" && (
                <Input
                  type="date"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="w-full text-sm"
                />
              )}
            </div>

            <div className="mt-3 flex gap-2 border-t border-[var(--color-neutral-200)] pt-3 dark:border-[var(--color-neutral-100)]">
              <Button
                size="sm"
                variant="primary"
                onClick={handleApply}
                className="flex-1 text-xs"
              >
                Applica
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1 text-xs"
              >
                Annulla
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

