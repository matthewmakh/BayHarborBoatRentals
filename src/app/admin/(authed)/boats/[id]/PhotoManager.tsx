"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Photo = { id: string; url: string; alt: string };

export function PhotoManager({ boatId, initialPhotos }: { boatId: string; initialPhotos: Photo[] }) {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/boats/${boatId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, alt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Add failed");
      setPhotos((p) => [...p, { id: data.id, url, alt }]);
      setUrl("");
      setAlt("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this photo?")) return;
    const res = await fetch(`/api/admin/photos/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPhotos((p) => p.filter((x) => x.id !== id));
      router.refresh();
    }
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = photos.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= photos.length) return;
    const reordered = [...photos];
    const [item] = reordered.splice(idx, 1);
    reordered.splice(next, 0, item);
    setPhotos(reordered);
    await fetch(`/api/admin/boats/${boatId}/photos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: reordered.map((p) => p.id) }),
    });
    router.refresh();
  }

  return (
    <div className="mt-4 grid gap-6">
      <form onSubmit={add} className="card p-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input className="input" placeholder="Image URL (https://...)" value={url} onChange={(e) => setUrl(e.target.value)} required />
        <input className="input" placeholder="Alt text (optional)" value={alt} onChange={(e) => setAlt(e.target.value)} />
        <button className="btn-primary" disabled={busy}>{busy ? "Adding…" : "Add photo"}</button>
      </form>
      {error && <p className="text-sm text-rose-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((p, i) => (
          <div key={p.id} className="card overflow-hidden">
            <div className="aspect-[4/3] bg-navy-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.alt} className="h-full w-full object-cover" />
            </div>
            <div className="p-3 flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-navy-600">{p.alt || "—"}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(p.id, -1)} disabled={i === 0} className="rounded-md bg-navy-50 px-2 py-1 text-navy-700 disabled:opacity-40">↑</button>
                <button type="button" onClick={() => move(p.id, 1)} disabled={i === photos.length - 1} className="rounded-md bg-navy-50 px-2 py-1 text-navy-700 disabled:opacity-40">↓</button>
                <button type="button" onClick={() => remove(p.id)} className="rounded-md bg-rose-50 px-2 py-1 text-rose-700">×</button>
              </div>
            </div>
          </div>
        ))}
        {photos.length === 0 && <p className="text-navy-500 text-sm">No photos yet.</p>}
      </div>
    </div>
  );
}
