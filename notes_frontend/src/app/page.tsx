"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import NoteCard from "@/components/NoteCard";
import NoteEditorModal from "@/components/NoteEditorModal";
import { createAppApiClient } from "@/lib/apiClient";
import { NotesApi, type Note } from "@/lib/notesApi";

type LoadState = "idle" | "loading" | "success" | "error";

type UiState = {
  query: string;
  selectedTag: string;
  showCreate: boolean;
  editNote: Note | null;
};

const api = new NotesApi(createAppApiClient());

export default function Home() {
  const [ui, setUi] = useState<UiState>({
    query: "",
    selectedTag: "",
    showCreate: false,
    editNote: null,
  });

  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const filteredTitle = useMemo(() => {
    const parts = [];
    if (ui.query.trim()) parts.push(`“${ui.query.trim()}”`);
    if (ui.selectedTag) parts.push(`#${ui.selectedTag}`);
    return parts.length ? `Filtered by ${parts.join(" · ")}` : "All notes";
  }, [ui.query, ui.selectedTag]);

  async function refreshAll(params: { query: string; tag: string }) {
    setError(null);
    setLoadState("loading");

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Load notes and tags in parallel (but keep one orchestration entrypoint).
      const [notesRes, tagsRes] = await Promise.all([
        api.listNotes(
          { q: params.query.trim() || undefined, tag: params.tag || undefined },
          controller.signal,
        ),
        api.listTags(controller.signal).catch(() => {
          // Tags are optional per requirements; if backend lacks /tags, don't break the app.
          return [] as string[];
        }),
      ]);

      setNotes(notesRes);
      setTags(tagsRes);
      setLoadState("success");
    } catch (e: unknown) {
      setLoadState("error");
      const message =
        e instanceof Error ? e.message : "Failed to load notes from the backend.";
      setError(message);
    }
  }

  // Initial load (explicit params; avoids react-hooks/exhaustive-deps disables)
  useEffect(() => {
    refreshAll({ query: "", tag: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search/filter refresh
  useEffect(() => {
    const t = window.setTimeout(() => {
      refreshAll({ query: ui.query, tag: ui.selectedTag });
    }, 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui.query, ui.selectedTag]);

  async function handleCreate(draft: { title: string; content: string; tags?: string[] }) {
    await api.createNote(draft);
    await refreshAll({ query: ui.query, tag: ui.selectedTag });
  }

  async function handleUpdate(
    noteId: Note["id"],
    draft: { title: string; content: string; tags?: string[] },
  ) {
    await api.updateNote(noteId, draft);
    await refreshAll({ query: ui.query, tag: ui.selectedTag });
  }

  async function handleDelete(note: Note) {
    const ok = window.confirm(
      `Delete "${note.title || "Untitled"}"? This cannot be undone.`,
    );
    if (!ok) return;
    await api.deleteNote(note.id);
    await refreshAll({ query: ui.query, tag: ui.selectedTag });
  }

  return (
    <>
      <AppShell
        title="Notes"
        subtitle="Fast, minimal, and searchable"
        right={
          <div className="flex items-center gap-2">
            <a
              className="hidden rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 sm:inline-flex"
              href={
                process.env.NEXT_PUBLIC_API_BASE_URL
                  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/docs`
                  : "http://localhost:3001/docs"
              }
              target="_blank"
              rel="noreferrer"
            >
              API Docs
            </a>
            <button
              type="button"
              className="hidden rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600 sm:inline-flex"
              onClick={() => setUi((s) => ({ ...s, showCreate: true }))}
            >
              New note
            </button>
          </div>
        }
        sidebar={
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="search">
                Search
              </label>
              <div className="mt-1">
                <input
                  id="search"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="Search notes…"
                  value={ui.query}
                  onChange={(e) => setUi((s) => ({ ...s, query: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-700">Tag filter</p>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                  onClick={() => setUi((s) => ({ ...s, selectedTag: "" }))}
                  disabled={!ui.selectedTag}
                >
                  Clear
                </button>
              </div>

              {tags.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((t) => {
                    const active = ui.selectedTag === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        className={
                          "rounded-full px-3 py-1 text-xs font-medium transition " +
                          (active
                            ? "bg-cyan-500 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200")
                        }
                        onClick={() =>
                          setUi((s) => ({ ...s, selectedTag: active ? "" : t }))
                        }
                      >
                        #{t}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  Tags are optional. If your backend doesn’t expose tags, this section will
                  stay empty.
                </p>
              )}
            </div>

            <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">{filteredTitle}</p>
              <p className="mt-1 text-xs text-slate-600">
                Notes: <span className="font-medium">{notes.length}</span>
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {error ? (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <h2 className="text-sm font-semibold text-red-800">Couldn’t load notes</h2>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <p className="mt-2 text-xs text-red-700/80">
                Ensure the backend is reachable and set{" "}
                <span className="font-mono">NEXT_PUBLIC_API_BASE_URL</span> if needed.
              </p>
            </section>
          ) : null}

          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">{filteredTitle}</h2>
            {loadState === "loading" ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : null}
          </div>

          {notes.length === 0 && loadState !== "loading" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">No notes yet</h3>
              <p className="mt-2 text-sm text-slate-600">
                Create your first note to get started. Add tags if you want quick
                filtering later.
              </p>
              <button
                type="button"
                className="mt-4 inline-flex rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
                onClick={() => setUi((s) => ({ ...s, showCreate: true }))}
              >
                New note
              </button>
            </section>
          ) : (
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {notes.map((n) => (
                <NoteCard
                  key={String(n.id)}
                  note={n}
                  onEdit={(note) => setUi((s) => ({ ...s, editNote: note }))}
                  onDelete={handleDelete}
                />
              ))}
            </section>
          )}
        </div>
      </AppShell>

      {/* Floating action button */}
      <button
        type="button"
        className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20 hover:from-blue-600 hover:to-cyan-600 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
        aria-label="Create a new note"
        onClick={() => setUi((s) => ({ ...s, showCreate: true }))}
      >
        <span className="text-2xl leading-none">+</span>
      </button>

      <NoteEditorModal
        open={ui.showCreate}
        mode="create"
        onClose={() => setUi((s) => ({ ...s, showCreate: false }))}
        onSave={handleCreate}
      />

      <NoteEditorModal
        open={!!ui.editNote}
        mode="edit"
        note={ui.editNote ?? undefined}
        onClose={() => setUi((s) => ({ ...s, editNote: null }))}
        onSave={(draft) => {
          if (!ui.editNote) return Promise.resolve();
          return handleUpdate(ui.editNote.id, draft);
        }}
      />
    </>
  );
}
