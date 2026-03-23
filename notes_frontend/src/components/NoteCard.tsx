"use client";

import React from "react";
import type { Note } from "@/lib/notesApi";
import TagChip from "@/components/TagChip";

type Props = {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
};

export default function NoteCard({ note, onEdit, onDelete }: Props) {
  const preview =
    note.content.length > 220 ? `${note.content.slice(0, 220).trim()}…` : note.content;

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900">
            {note.title || "Untitled"}
          </h3>
          {(note.created_at || note.updated_at) && (
            <p className="mt-1 text-xs text-slate-500">
              {note.updated_at ? `Updated ${new Date(note.updated_at).toLocaleString()}` : null}
              {!note.updated_at && note.created_at
                ? `Created ${new Date(note.created_at).toLocaleString()}`
                : null}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100">
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => onEdit(note)}
          >
            Edit
          </button>
          <button
            type="button"
            className="rounded-lg border border-red-200 px-2.5 py-1.5 text-sm text-red-700 hover:bg-red-50"
            onClick={() => onDelete(note)}
          >
            Delete
          </button>
        </div>
      </header>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{preview}</p>

      {note.tags && note.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {note.tags.slice(0, 8).map((t) => (
            <TagChip key={t} tag={t} />
          ))}
        </div>
      ) : null}
    </article>
  );
}
