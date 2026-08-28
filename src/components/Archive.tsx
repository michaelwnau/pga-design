"use client";

import { useCallback, useEffect, useState } from "react";
import {
  compLabel,
  compSeriesId,
  renderBlob,
  renderDataUrl,
} from "@/lib/render";
import { createZip, type ZipEntry } from "@/lib/zip";
import type { Composition } from "@/lib/types";

export interface ArchiveItem {
  id: string;
  comp: Composition;
  thumb: string; // data URL
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

// Unique, collision-safe file names within one download bundle.
function uniqueNames(items: ArchiveItem[]): string[] {
  const seen = new Map<string, number>();
  return items.map((it) => {
    const base = `pga-${compSeriesId(it.comp)}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n === 0 ? `${base}.png` : `${base}-${n}.png`;
  });
}

// In-session archive of generated versions. Held in React state only, so it
// clears on every page reload — there is no persistence by design.
export function Archive({
  items,
  onOpen,
  onClear,
}: {
  items: ArchiveItem[];
  onOpen: (item: ArchiveItem) => void;
  onClear: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<ArchiveItem | null>(null);
  const [busy, setBusy] = useState(false);

  // Drop selections for items that no longer exist (e.g. after Clear).
  useEffect(() => {
    setSelected((prev) => {
      const ids = new Set(items.map((i) => i.id));
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allSelected = items.length > 0 && selected.size === items.length;
  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((i) => i.id)),
    );
  }, [items]);

  const downloadOne = useCallback(async (item: ArchiveItem) => {
    const blob = await renderBlob(item.comp);
    if (blob) triggerDownload(blob, `pga-${compSeriesId(item.comp)}.png`);
  }, []);

  const downloadBundle = useCallback(async () => {
    const chosen = selected.size
      ? items.filter((i) => selected.has(i.id))
      : items;
    if (chosen.length === 0) return;
    if (chosen.length === 1) {
      await downloadOne(chosen[0]);
      return;
    }
    setBusy(true);
    try {
      const names = uniqueNames(chosen);
      const entries: ZipEntry[] = [];
      for (let i = 0; i < chosen.length; i++) {
        const blob = await renderBlob(chosen[i].comp);
        if (blob) {
          entries.push({ name: names[i], data: new Uint8Array(await blob.arrayBuffer()) });
        }
      }
      if (entries.length) triggerDownload(createZip(entries), "pga-archive.zip");
    } finally {
      setBusy(false);
    }
  }, [items, selected, downloadOne]);

  const selectionCount = selected.size;

  return (
    <div className="h-full w-full overflow-y-auto bg-bg p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h1 className="mono text-[13px] tracking-[0.2em] text-text">
              SESSION ARCHIVE
            </h1>
            <p className="mt-1 text-[11px] text-text-faint">
              Versions you generate this session — cleared on reload.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="mono mr-1 text-[11px] text-text-faint">
              {selectionCount ? `${selectionCount} selected` : `${items.length} total`}
            </span>
            {items.length > 0 && (
              <>
                <RailBtn onClick={toggleAll}>
                  {allSelected ? "NONE" : "ALL"}
                </RailBtn>
                <RailBtn onClick={downloadBundle} disabled={busy} accent>
                  {busy
                    ? "ZIPPING…"
                    : selectionCount > 1
                      ? `↓ ZIP ${selectionCount}`
                      : "↓ DOWNLOAD"}
                </RailBtn>
                <RailBtn onClick={onClear}>CLEAR</RailBtn>
              </>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
            <div className="mono text-[12px] tracking-[0.14em] text-text-dim">
              NOTHING HERE YET
            </div>
            <p className="mt-2 max-w-xs text-[12px] leading-relaxed text-text-faint">
              Hit <span className="text-text-dim">GENERATE</span> in the studio to
              spin new versions. They collect here until you reload.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => {
              const isSel = selected.has(item.id);
              return (
                <figure key={item.id} className="group">
                  <div
                    className={`checker relative flex h-44 items-center justify-center overflow-hidden rounded-md border transition-colors ${
                      isSel ? "border-accent" : "border-border group-hover:border-text-dim"
                    }`}
                  >
                    <button
                      onClick={() => setPreview(item)}
                      className="flex h-full w-full items-center justify-center"
                      title="Preview full size"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.thumb}
                        alt={`pga-${compSeriesId(item.comp)}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    </button>
                    <label className="absolute left-2 top-2 flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggle(item.id)}
                        aria-label={`Select pga-${compSeriesId(item.comp)}`}
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                    </label>
                  </div>
                  <figcaption className="mt-2 flex items-center justify-between gap-2">
                    <span className="mono truncate text-[11px] text-text">
                      pga-{compSeriesId(item.comp)}
                    </span>
                    <span className="flex items-center gap-2 text-text-faint">
                      <span className="truncate text-[10px]">{compLabel(item.comp)}</span>
                      <button
                        onClick={() => onOpen(item)}
                        title="Open in studio"
                        className="mono text-[10px] text-text-dim hover:text-text"
                      >
                        OPEN
                      </button>
                      <button
                        onClick={() => downloadOne(item)}
                        title="Download PNG"
                        className="text-text-dim hover:text-text"
                      >
                        ↓
                      </button>
                    </span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        )}
      </div>

      {preview && (
        <PreviewModal
          item={preview}
          onClose={() => setPreview(null)}
          onOpen={() => {
            onOpen(preview);
            setPreview(null);
          }}
          onDownload={() => downloadOne(preview)}
        />
      )}
    </div>
  );
}

function RailBtn({
  children,
  onClick,
  disabled,
  accent,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`mono rounded-md border px-3 py-1.5 text-[11px] tracking-[0.12em] transition-colors disabled:opacity-50 ${
        accent
          ? "border-border-2 text-text hover:border-accent hover:text-accent"
          : "border-border-2 text-text-dim hover:border-text-dim hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

function PreviewModal({
  item,
  onClose,
  onOpen,
  onDownload,
}: {
  item: ArchiveItem;
  onClose: () => void;
  onOpen: () => void;
  onDownload: () => void;
}) {
  const [url, setUrl] = useState<string>(item.thumb);

  // Render a crisp full-resolution image for the modal.
  useEffect(() => {
    setUrl(renderDataUrl(item.comp));
  }, [item]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
      <button
        aria-label="Close preview"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative flex max-h-full max-w-5xl flex-col">
        <div className="mb-3 flex items-center justify-between">
          <span className="mono text-[12px] tracking-[0.14em] text-text">
            pga-{compSeriesId(item.comp)}{" "}
            <span className="text-text-faint">· {compLabel(item.comp)}</span>
          </span>
          <div className="flex items-center gap-2">
            <RailBtn onClick={onOpen}>OPEN IN STUDIO</RailBtn>
            <RailBtn onClick={onDownload} accent>
              ↓ PNG
            </RailBtn>
            <RailBtn onClick={onClose}>✕ CLOSE</RailBtn>
          </div>
        </div>
        <div className="checker flex min-h-0 items-center justify-center overflow-auto rounded-md border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`pga-${compSeriesId(item.comp)} full size`}
            className="max-h-[80vh] max-w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}
