"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Blackout = {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
};

function fmt(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function BlackoutManager({ boatId, initial }: { boatId: string; initial: Blackout[] }) {
  const router = useRouter();
  const [list, setList] = useState<Blackout[]>(initial);
  const [draft, setDraft] = useState({
    startDate: "",
    startTime: "08:00",
    endDate: "",
    endTime: "20:00",
    reason: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/boats/${boatId}/blackouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Add failed");
      // Optimistic refresh
      router.refresh();
      const startsAt = new Date(`${draft.startDate}T${draft.startTime}:00`).toISOString();
      const endsAt = new Date(`${draft.endDate}T${draft.endTime}:00`).toISOString();
      setList((l) => [...l, { id: data.id, startsAt, endsAt, reason: draft.reason || null }]);
      setDraft({ ...draft, startDate: "", endDate: "", reason: "" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Add failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this blackout?")) return;
    const res = await fetch(`/api/admin/blackouts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setList((l) => l.filter((x) => x.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="mt-4 grid gap-4">
      <form onSubmit={add} className="card p-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Start date</label>
          <input type="date" className="input" required value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
        </div>
        <div>
          <label className="label">Start time (ET)</label>
          <input type="time" className="input" required value={draft.startTime} onChange={(e) => setDraft({ ...draft, startTime: e.target.value })} />
        </div>
        <div>
          <label className="label">End date</label>
          <input type="date" className="input" required value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} />
        </div>
        <div>
          <label className="label">End time (ET)</label>
          <input type="time" className="input" required value={draft.endTime} onChange={(e) => setDraft({ ...draft, endTime: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Reason (optional)</label>
          <input className="input" value={draft.reason} onChange={(e) => setDraft({ ...draft, reason: e.target.value })} placeholder="Maintenance / owner use / weather" />
        </div>
        <div className="sm:col-span-2 flex items-center gap-3">
          <button className="btn-primary" disabled={busy}>{busy ? "Adding…" : "Block these times"}</button>
          {err && <span className="text-sm text-rose-700">{err}</span>}
        </div>
      </form>

      <div className="grid gap-2">
        {list.length === 0 && <p className="text-navy-500 text-sm">No blackouts on this boat.</p>}
        {list.map((b) => (
          <div key={b.id} className="card p-4 flex items-center justify-between gap-3">
            <div className="text-sm">
              <div className="font-medium text-navy-800">{fmt(b.startsAt)} → {fmt(b.endsAt)}</div>
              {b.reason && <div className="text-navy-500">{b.reason}</div>}
            </div>
            <button onClick={() => remove(b.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
