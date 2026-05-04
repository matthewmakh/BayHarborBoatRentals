"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
  "pending_waiver",
  "waiver_completed",
  "pending_payment",
  "deposit_paid",
  "cancelled",
  "completed",
] as const;

type Status = (typeof STATUSES)[number];

export function BookingStatusForm({ bookingId, current }: { bookingId: string; current: Status }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(current);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 card p-4 flex items-center gap-3">
      <select className="input max-w-xs" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button onClick={save} disabled={busy} className="btn-primary text-sm">{busy ? "Saving…" : "Save"}</button>
      {err && <span className="text-sm text-rose-700">{err}</span>}
    </div>
  );
}
