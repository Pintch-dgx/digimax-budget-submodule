"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui";
import { AppNav } from "./AppNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const THEME_STORAGE_KEY = "digimax-theme";

type ThemeMode = "light" | "dark";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/campaigns": "Campagne Marketing",
  "/budget-requests": "Richieste Budget",
  "/approvals": "Approvazioni",
  "/reports": "Reportistica",
  "/okr": "Planner OKR",
};

type FunctionKey = "marketing" | "ict" | "operations" | "r_and_d";

const FUNCTIONS: Array<{
  key: FunctionKey;
  label: string;
  description: string;
}> = [
  { key: "marketing", label: "Marketing", description: "Budget Hub" },
  { key: "ict", label: "ICT & Cyber", description: "Digital security & infrastructure" },
  { key: "operations", label: "Operations", description: "Sales, people & internal processes" },
  { key: "r_and_d", label: "R&D", description: "Innovation & product development" },
];

function resolveInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const SIDEBAR_COLLAPSED_KEY = "digimax-sidebar-collapsed";
const FUNCTION_STORAGE_KEY = "digimax-active-function";

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<ThemeMode | null>(null);
  const [activeFunction, setActiveFunction] = useState<FunctionKey>("marketing");
  const [hydrated, setHydrated] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const detectedTheme = resolveInitialTheme();
    setTheme(detectedTheme);
    const storedSidebar = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (storedSidebar === "true") {
      setSidebarCollapsed(true);
    }
    const storedFunction = localStorage.getItem(FUNCTION_STORAGE_KEY) as FunctionKey | null;
    if (storedFunction && FUNCTIONS.some((fn) => fn.key === storedFunction)) {
      setActiveFunction(storedFunction);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || !theme) return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(FUNCTION_STORAGE_KEY, activeFunction);
  }, [activeFunction]);

  const pageTitle = useMemo(() => {
    if (!pathname) return "";
    if (pageTitles[pathname]) return pageTitles[pathname];
    const match = Object.entries(pageTitles).find(([route]) => route !== "/" && pathname.startsWith(route));
    return match ? match[1] : "Budget Hub";
  }, [pathname]);

  const handleToggleTheme = () => {
    setTheme((prev) => {
      if (prev === "dark") return "light";
      if (prev === "light") return "dark";
      return resolveInitialTheme();
    });
  };

  const activeFunctionMeta = useMemo(() => FUNCTIONS.find((fn) => fn.key === activeFunction) ?? FUNCTIONS[0], [activeFunction]);

  return (
    <div className="min-h-screen bg-[var(--color-background)] font-sans text-[var(--color-foreground)]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[var(--color-neutral-900)]/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen ${
          sidebarCollapsed ? "w-[4.5rem]" : "w-[17rem]"
        } -translate-x-full transform border-r border-[var(--color-neutral-200)] bg-[var(--color-surface)] transition-all duration-300 ease-in-out shadow-lg shadow-[var(--color-neutral-900)]/5 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : ""
        }`}
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-[var(--color-neutral-200)] px-6 py-6">
            <div className="relative flex flex-col gap-3">
              {!sidebarCollapsed && (
                <div className="flex items-center">
                  <span
                    role="img"
                    aria-label="Digimax Budget Hub"
                    className="logo-brand block h-10"
                    style={{ aspectRatio: "3246 / 586" }}
                  />
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`self-end rounded-md p-1.5 text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]/70 dark:hover:bg-[var(--color-secondary-industrial)]/20 ${sidebarCollapsed ? "self-center" : ""}`}
                aria-label={sidebarCollapsed ? "Espandi menu" : "Comprimi menu"}
                title={sidebarCollapsed ? "Espandi menu" : "Comprimi menu"}
              >
                <svg
                  className={`h-5 w-5 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6" aria-label="Main navigation">
            <AppNav collapsed={sidebarCollapsed} />
          </nav>

          <div className={`border-t border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)] p-4 dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface)]/60 ${sidebarCollapsed ? "px-2" : ""}`}>
            {!sidebarCollapsed ? (
              <>
                <div className="mb-3 text-sm">
                  <p className="font-semibold text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]">
                    {session?.user?.name || session?.user?.email}
                  </p>
                  <p className="text-xs text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">{session?.user?.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={handleToggleTheme}
                    className="flex-1 dark:bg-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)] dark:hover:bg-[var(--color-primary-dark)]"
                    aria-label="Toggle theme"
                  >
                    {hydrated && theme ? (theme === "dark" ? "Light" : "Dark") : "Tema"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/signin" })}
                    className="flex-1 justify-center"
                    aria-label="Sign out"
                  >
                    Esci
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={handleToggleTheme}
                  className="dark:bg-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)] dark:hover:bg-[var(--color-primary-dark)]"
                  aria-label="Toggle theme"
                  title={hydrated && theme ? (theme === "dark" ? "Light Mode" : "Dark Mode") : "Tema"}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {hydrated && theme === "dark" ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    )}
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/signin" })}
                  className="justify-center"
                  aria-label="Sign out"
                  title="Esci"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className={`transition-all duration-300 ${sidebarCollapsed ? "lg:pl-[4.5rem]" : "lg:pl-[17rem]"}`}>
        <header
          className="sticky top-0 z-30 border-b border-[var(--color-neutral-200)] bg-[var(--color-surface)]/95 px-4 py-4 shadow-sm shadow-[var(--color-neutral-900)]/5 backdrop-blur md:px-6"
          role="banner"
        >
          <div className="mx-auto flex w-full max-w-[95vw] xl:max-w-[98vw] 2xl:max-w-[99vw] flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden"
                  aria-label="Toggle navigation menu"
                  aria-expanded={sidebarOpen}
                  aria-controls="main-navigation"
                >
                  <svg
                    className="h-6 w-6 text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    {sidebarOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
                {sidebarCollapsed && !sidebarOpen && (
                  <>
                    <span
                      role="img"
                      aria-label="Digimax Budget Hub"
                      className="logo-brand block h-8"
                      style={{ aspectRatio: "3246 / 586" }}
                    />
                    <div className="h-[42px] w-px bg-[var(--color-neutral-300)] dark:bg-[var(--color-neutral-600)]" aria-hidden="true" />
                  </>
                )}
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wide text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                    funzione
                  </span>
                  <span className="text-lg font-semibold text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]">
                    {activeFunctionMeta.label}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {FUNCTIONS.map((fn) => (
                  <Button
                    key={fn.key}
                    size="sm"
                    variant={fn.key === activeFunction ? "primary" : "outline"}
                    onClick={() => setActiveFunction(fn.key)}
                  >
                    {fn.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-tight text-[var(--color-primary)] dark:text-[var(--color-tertiary-ice)]">
                  {pageTitle}
                </h2>
                <span className="text-sm text-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)]/70">
                  {activeFunctionMeta.description}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[95vw] xl:max-w-[98vw] 2xl:max-w-[99vw] space-y-8 px-2 py-6 sm:px-3 sm:py-8 md:px-4 md:py-10 lg:px-6 lg:py-10 xl:px-8 xl:py-12" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}

