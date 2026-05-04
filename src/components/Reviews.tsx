import type { Review } from "@prisma/client";

export function Reviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  return (
    <section id="reviews" className="bg-sand py-16">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-navy-600">Reviews</p>
          <h2 className="mt-2 text-3xl font-serif text-navy-800">What our guests say</h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <article key={r.id} className="card p-6">
              <Stars n={r.rating} />
              <p className="mt-3 text-navy-800 leading-relaxed">“{r.body}”</p>
              <p className="mt-4 text-sm font-semibold text-navy-700">— {r.authorName}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <div aria-label={`${n} out of 5 stars`} className="flex gap-1 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`h-4 w-4 ${i < n ? "" : "text-navy-200"}`} viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9L10 14.9 4.7 17.8l1-5.9L1.5 7.7l5.9-.8L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}
