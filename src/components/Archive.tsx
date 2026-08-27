"use client";

import { compLabel, compSeriesId } from "@/lib/render";
import type { Composition } from "@/lib/types";

export interface ArchiveItem {
  id: string;
  comp: Composition;
  thumb: string; // data URL
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
  return (
    <div className="h-full w-full overflow-y-auto bg-bg p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-baseline justify-between">
          <div>
            <h1 className="mono text-[13px] tracking-[0.2em] text-text">
              SESSION ARCHIVE
            </h1>
            <p className="mt-1 text-[11px] text-text-faint">
              Versions you generate this session — cleared on reload.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="mono text-[11px] text-text-faint">
              {items.length} {items.length === 1 ? "version" : "versions"}
            </span>
            {items.length > 0 && (
              <button
                onClick={onClear}
                className="mono rounded-md border border-border-2 px-3 py-1.5 text-[11px] tracking-[0.12em] text-text-dim transition-colors hover:border-accent hover:text-accent"
              >
                CLEAR
              </button>
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
            {items.map((item) => (
              <figure key={item.id} className="group">
                <button
                  onClick={() => onOpen(item)}
                  className="checker block w-full overflow-hidden rounded-md border border-border transition-colors hover:border-text-dim"
                  title="Open in studio"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumb}
                    alt={`pga-${compSeriesId(item.comp)}`}
                    className="aspect-[3/4] w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </button>
                <figcaption className="mt-2 flex items-baseline justify-between gap-2">
                  <span className="mono text-[11px] text-text">
                    pga-{compSeriesId(item.comp)}
                  </span>
                  <span className="truncate text-[10px] text-text-faint">
                    {compLabel(item.comp)}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
