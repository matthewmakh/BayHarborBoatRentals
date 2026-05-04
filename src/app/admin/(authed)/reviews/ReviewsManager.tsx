"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  published: boolean;
  sortOrder: number;
};

export function ReviewsManager({ initial }: { initial: Review[] }) {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>(initial);
  const [draft, setDraft] = useState({ authorName: "", rating: 5, body: "", published: true, sortOrder: 0 });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Add failed");
      setReviews((rs) => [...rs, { ...draft, id: data.id }]);
      setDraft({ authorName: "", rating: 5, body: "", published: true, sortOrder: 0 });
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Add failed");
    } finally {
      setBusy(false);
    }
  }

  async function update(id: string, patch: Partial<Review>) {
    setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this review?")) return;
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    if (res.ok) {
      setReviews((rs) => rs.filter((r) => r.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="mt-6 grid gap-6">
      <form onSubmit={add} className="card p-6 grid gap-3 sm:grid-cols-2">
        <input className="input" placeholder="Author name" value={draft.authorName} onChange={(e) => setDraft({ ...draft, authorName: e.target.value })} required />
        <input type="number" min={1} max={5} className="input" placeholder="Rating" value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })} />
        <textarea className="input sm:col-span-2" rows={3} placeholder="Review text" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} required />
        <label className="text-sm text-navy-700 flex items-center gap-2">
          <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} /> Published
        </label>
        <input type="number" className="input" placeholder="Sort order" value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })} />
        <button className="btn-primary sm:col-span-2" disabled={busy}>{busy ? "Adding…" : "Add review"}</button>
        {err && <p className="text-sm text-rose-700 sm:col-span-2">{err}</p>}
      </form>

      <div className="grid gap-4">
        {reviews.map((r) => (
          <div key={r.id} className="card p-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="grid gap-2">
              <input className="input" value={r.authorName} onChange={(e) => update(r.id, { authorName: e.target.value })} />
              <textarea className="input" rows={3} value={r.body} onChange={(e) => update(r.id, { body: e.target.value })} />
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <label className="flex items-center gap-1">Rating
                  <input type="number" min={1} max={5} className="input w-20" value={r.rating} onChange={(e) => update(r.id, { rating: Number(e.target.value) })} />
                </label>
                <label className="flex items-center gap-1">Sort
                  <input type="number" className="input w-20" value={r.sortOrder} onChange={(e) => update(r.id, { sortOrder: Number(e.target.value) })} />
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={r.published} onChange={(e) => update(r.id, { published: e.target.checked })} />
                  Published
                </label>
              </div>
            </div>
            <div className="flex items-start">
              <button onClick={() => remove(r.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 hover:bg-rose-100">Delete</button>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-navy-500 text-sm">No reviews yet.</p>}
      </div>
    </div>
  );
}
