"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui";
import { AppNav } from "./AppNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 dark:bg-slate-950/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 -translate-x-full transform border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : ""
        }`}
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h1 className="text-xl font-semibold">Budget Hub</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Digimax Marketing</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6" aria-label="Main navigation">
            <AppNav />
          </nav>

          {/* User section */}
          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <div className="mb-3 text-sm">
              <p className="font-medium">{session?.user?.name || session?.user?.email}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{session?.user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/signin" })}
              className="w-full justify-start"
              aria-label="Sign out"
            >
              Esci
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header
          className="sticky top-0 z-30 border-b border-slate-200 bg-white px-6 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          role="banner"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={sidebarOpen}
              aria-controls="main-navigation"
            >
              <svg
                className="h-6 w-6 text-slate-600 dark:text-slate-400"
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
            <div className="flex-1 lg:flex-none">
              <h2 className="text-lg font-semibold">Dashboard</h2>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-7xl px-6 py-8" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}

