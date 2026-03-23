"use client";

import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
};

export default function AppShell({ title, subtitle, right, sidebar, children }: Props) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-sm" />
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold">{title}</h1>
                {subtitle ? (
                  <p className="truncate text-sm text-slate-500">{subtitle}</p>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">{right}</div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-4 py-5 md:grid-cols-[280px_1fr]">
        <aside className="md:sticky md:top-[76px] md:h-[calc(100vh-76px)] md:overflow-auto">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {sidebar}
          </div>
        </aside>
        <main className="min-h-[60vh]">{children}</main>
      </div>
    </div>
  );
}
