"use client";

import { GALLERY } from "@/lib/gallery";

// Static archive grid. Uses <img> (not next/image) because these are fixed
// local plates and we want zero layout dependency on the optimizer.
export function Gallery() {
  return (
    <div className="h-full w-full overflow-y-auto bg-bg p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="mono text-[13px] tracking-[0.2em] text-text">ARCHIVE</h1>
          <span className="mono text-[11px] text-text-faint">
            {GALLERY.length} prints
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {GALLERY.map((item) => (
            <figure key={item.file} className="group">
              <div className="checker overflow-hidden rounded-md border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/gallery/${item.file}`}
                  alt={item.title}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <figcaption className="mt-2 flex items-baseline justify-between gap-2">
                <span className="mono text-[11px] text-text">{item.title}</span>
                <span className="text-[10px] text-text-faint">{item.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
