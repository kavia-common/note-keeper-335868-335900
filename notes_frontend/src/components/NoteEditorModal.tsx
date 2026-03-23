"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Note } from "@/lib/notesApi";
import Modal from "@/components/Modal";

export type NoteDraft = {
  title: string;
  content: string;
  tagsText: string; // comma-separated string in UI
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  note?: Note;
  onClose: () => void;
  onSave: (draft: { title: string; content: string; tags?: string[] }) => Promise<void>;
};

function parseTags(tagsText: string): string[] {
  return tagsText
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.replace(/^#/, ""));
}

export default function NoteEditorModal({ open, mode, note, onClose, onSave }: Props) {
  const initialDraft: NoteDraft = useMemo(() => {
    if (mode === "edit" && note) {
      return {
        title: note.title ?? "",
        content: note.content ?? "",
        tagsText: (note.tags ?? []).join(", "),
      };
    }
    return { title: "", content: "", tagsText: "" };
  }, [mode, note]);

  const [draft, setDraft] = useState<NoteDraft>(initialDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setDraft(initialDraft), [initialDraft]);

  async function handleSave() {
    setError(null);

    const title = draft.title.trim();
    const content = draft.content.trim();

    // Minimal validation with clear invariant:
    // Notes must have non-empty content; title can be empty (will show "Untitled").
    if (!content) {
      setError("Please enter some content for the note.");
      return;
    }

    const tags = parseTags(draft.tagsText);
    setSaving(true);
    try {
      await onSave({ title, content, tags: tags.length ? tags : undefined });
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to save note.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={mode === "create" ? "New note" : "Edit note"}
      description="Write your note, add optional tags, and save."
      onClose={() => {
        if (!saving) onClose();
      }}
      footer={
        <>
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="note-title">
            Title
          </label>
          <input
            id="note-title"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
            placeholder="Optional title…"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            disabled={saving}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="note-content">
            Content <span className="text-slate-400">(required)</span>
          </label>
          <textarea
            id="note-content"
            className="min-h-40 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 outline-none focus:ring-2 focus:ring-cyan-500/25"
            placeholder="Write your note…"
            value={draft.content}
            onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
            disabled={saving}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="note-tags">
            Tags <span className="text-slate-400">(comma-separated)</span>
          </label>
          <input
            id="note-tags"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
            placeholder="work, personal, ideas"
            value={draft.tagsText}
            onChange={(e) => setDraft((d) => ({ ...d, tagsText: e.target.value }))}
            disabled={saving}
          />
          <p className="text-xs text-slate-500">
            Tip: you can type <span className="font-medium">#tag</span> or{" "}
            <span className="font-medium">tag</span>; both work.
          </p>
        </div>
      </div>
    </Modal>
  );
}
