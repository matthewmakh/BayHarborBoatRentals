"use client";

import { useEffect, useRef, useState } from "react";

type Photo = { id: string; url: string; alt: string | null };

export function BoatGallery({ photos, altBase }: { photos: Photo[]; altBase: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [active, setActive] = useState(0);

  // Track which slide is centered using IntersectionObserver
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = active;
        let bestRatio = 0;
        for (const entry of entries) {
          const idx = Number((entry.target as HTMLElement).dataset.idx);
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = idx;
          }
        }
        if (bestRatio > 0.55) setActive(bestIndex);
      },
      { root, threshold: [0.55, 0.75, 1] }
    );
    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length]);

  function scrollToIdx(i: number) {
    const el = slideRefs.current[i];
    if (!el || !scrollerRef.current) return;
    scrollerRef.current.scrollTo({ left: el.offsetLeft, behavior: "smooth" });
  }

  function nudge(dir: -1 | 1) {
    const next = Math.max(0, Math.min(photos.length - 1, active + dir));
    scrollToIdx(next);
  }

  if (photos.length === 0) {
    return <div className="aspect-[4/3] rounded-2xl bg-navy-50 flex items-center justify-center text-navy-400">No photos</div>;
  }

  return (
    <div>
      {/* Main swipeable strip */}
      <div className="relative group">
        <div
          ref={scrollerRef}
          className="no-scrollbar flex overflow-x-auto snap-x snap-mandatory rounded-2xl bg-navy-50"
          style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
        >
          {photos.map((p, i) => (
            <div
              key={p.id}
              data-idx={i}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              className="snap-center shrink-0 w-full"
              style={{ scrollSnapAlign: "center" }}
            >
              <div className="aspect-[16/10] sm:aspect-[3/2] lg:aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.alt || altBase}
                  className="h-full w-full object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              </div>
            </div>
          ))}
        </div>

        {photos.length > 1 && (
          <>
            {/* Counter pill */}
            <div className="absolute bottom-3 right-3 rounded-full bg-black/60 text-white text-xs px-3 py-1 backdrop-blur-sm pointer-events-none">
              {active + 1} / {photos.length}
            </div>

            {/* Prev / Next buttons (desktop) */}
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => nudge(-1)}
              disabled={active === 0}
              className="hidden md:grid place-items-center absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow text-navy-800 hover:bg-white disabled:opacity-0 transition opacity-0 group-hover:opacity-100"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => nudge(1)}
              disabled={active === photos.length - 1}
              className="hidden md:grid place-items-center absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow text-navy-800 hover:bg-white disabled:opacity-0 transition opacity-0 group-hover:opacity-100"
            >
              ›
            </button>

            {/* Dots (mobile) */}
            <div className="md:hidden absolute left-1/2 -translate-x-1/2 bottom-3 flex gap-1.5">
              {photos.map((p, i) => (
                <span
                  key={p.id}
                  aria-hidden="true"
                  className={`h-1.5 rounded-full transition-all ${
                    i === active ? "w-5 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip — horizontal scroll on overflow */}
      {photos.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => {
            const isActive = i === active;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => scrollToIdx(i)}
                aria-label={`Go to photo ${i + 1}`}
                className={`shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  isActive ? "border-navy-600" : "border-transparent opacity-70 hover:opacity-100"
                }`}
                style={{ width: 88, height: 64 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.alt || altBase} className="h-full w-full object-cover" loading="lazy" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
