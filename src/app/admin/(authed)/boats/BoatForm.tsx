"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  id?: string;
  slug?: string;
  name?: string;
  year?: number;
  lengthFeet?: number;
  maxCapacity?: number;
  description?: string;
  status?: "available" | "unavailable" | "maintenance";
  price2hCents?: number;
  price4hCents?: number;
  price6hCents?: number;
  price8hCents?: number;
  depositPercentOverride?: number | null;
  sortOrder?: number;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  ownerNotes?: string | null;
};

function dollars(cents?: number): string {
  return cents != null ? (cents / 100).toFixed(2) : "";
}

export function BoatForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const editing = Boolean(initial?.id);
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [year, setYear] = useState(initial?.year ?? new Date().getFullYear());
  const [lengthFeet, setLengthFeet] = useState(initial?.lengthFeet ?? 25);
  const [maxCapacity, setMaxCapacity] = useState(initial?.maxCapacity ?? 8);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<Initial["status"]>(initial?.status ?? "available");
  const [p2, setP2] = useState(dollars(initial?.price2hCents));
  const [p4, setP4] = useState(dollars(initial?.price4hCents));
  const [p6, setP6] = useState(dollars(initial?.price6hCents));
  const [p8, setP8] = useState(dollars(initial?.price8hCents));
  const [depositOverride, setDepositOverride] = useState(
    initial?.depositPercentOverride != null ? String(initial.depositPercentOverride) : ""
  );
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [ownerName, setOwnerName] = useState(initial?.ownerName ?? "");
  const [ownerEmail, setOwnerEmail] = useState(initial?.ownerEmail ?? "");
  const [ownerPhone, setOwnerPhone] = useState(initial?.ownerPhone ?? "");
  const [ownerNotes, setOwnerNotes] = useState(initial?.ownerNotes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name,
        slug: slug || undefined,
        year: Number(year),
        lengthFeet: Number(lengthFeet),
        maxCapacity: Number(maxCapacity),
        description,
        status,
        price2hCents: Math.round(parseFloat(p2 || "0") * 100),
        price4hCents: Math.round(parseFloat(p4 || "0") * 100),
        price6hCents: Math.round(parseFloat(p6 || "0") * 100),
        price8hCents: Math.round(parseFloat(p8 || "0") * 100),
        depositPercentOverride: depositOverride === "" ? null : Number(depositOverride),
        sortOrder: Number(sortOrder),
        ownerName: ownerName.trim() || null,
        ownerEmail: ownerEmail.trim() || null,
        ownerPhone: ownerPhone.trim() || null,
        ownerNotes: ownerNotes.trim() || null,
      };
      const res = await fetch(editing ? `/api/admin/boats/${initial!.id}` : "/api/admin/boats", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      router.push(editing ? `/admin/boats/${initial!.id}` : `/admin/boats/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove() {
    if (!editing) return;
    if (!confirm("Delete this boat? This cannot be undone.")) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/boats/${initial!.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      router.push("/admin/boats");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-6">
      <div className="card p-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">Name</label><input className="input" required value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="sm:col-span-2"><label className="label">Slug (auto from name if blank)</label><input className="input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="azure-25" /></div>
        <div><label className="label">Year</label><input type="number" className="input" required value={year} onChange={(e) => setYear(parseInt(e.target.value || "0", 10))} /></div>
        <div><label className="label">Length (ft)</label><input type="number" className="input" required value={lengthFeet} onChange={(e) => setLengthFeet(parseInt(e.target.value || "0", 10))} /></div>
        <div><label className="label">Max capacity</label><input type="number" className="input" required value={maxCapacity} onChange={(e) => setMaxCapacity(parseInt(e.target.value || "0", 10))} /></div>
        <div><label className="label">Status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Initial["status"])}>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <div className="sm:col-span-2"><label className="label">Description</label><textarea rows={4} className="input" required value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      </div>

      <div className="card p-6 grid gap-4 sm:grid-cols-4">
        <div><label className="label">2 hr ($)</label><input type="number" step="0.01" className="input" value={p2} onChange={(e) => setP2(e.target.value)} required /></div>
        <div><label className="label">4 hr ($)</label><input type="number" step="0.01" className="input" value={p4} onChange={(e) => setP4(e.target.value)} required /></div>
        <div><label className="label">6 hr ($)</label><input type="number" step="0.01" className="input" value={p6} onChange={(e) => setP6(e.target.value)} required /></div>
        <div><label className="label">8 hr ($)</label><input type="number" step="0.01" className="input" value={p8} onChange={(e) => setP8(e.target.value)} required /></div>
        <div className="sm:col-span-2"><label className="label">Deposit % override (blank = use global)</label><input type="number" min={0} max={100} className="input" value={depositOverride} onChange={(e) => setDepositOverride(e.target.value)} placeholder="e.g. 25" /></div>
        <div><label className="label">Sort order</label><input type="number" className="input" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value || "0", 10))} /></div>
      </div>

      {/* Internal-only ownership / brokering info — never shown to public, surfaced in admin
          booking views and operator notification emails. */}
      <div className="card p-6">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-navy-800">Owner / brokering info</h2>
            <p className="text-sm text-navy-600">Internal only. Shown on admin booking pages and admin notification emails. Never visible to customers.</p>
          </div>
          <span className="badge bg-amber-50 text-amber-700 border-amber-200">Admin-only</span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Owner name</label>
            <input className="input" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="e.g. Mike Rodriguez" />
          </div>
          <div>
            <label className="label">Owner phone</label>
            <input className="input" type="tel" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="(305) 555-1234" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Owner email</label>
            <input className="input" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="owner@example.com" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Internal notes (optional)</label>
            <textarea rows={3} className="input" value={ownerNotes} onChange={(e) => setOwnerNotes(e.target.value)} placeholder="Commission split, dock location, key handoff procedure, etc." />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-rose-700">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : editing ? "Save changes" : "Create boat"}
        </button>
        {editing && (
          <button type="button" onClick={remove} className="btn-secondary text-rose-700 border-rose-200 hover:bg-rose-50">
            Delete boat
          </button>
        )}
      </div>
    </form>
  );
}
