"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type BoatLite = {
  id: string;
  slug: string;
  name: string;
  price2hCents: number;
  price4hCents: number;
  price6hCents: number;
  price8hCents: number;
  photo: string | null;
};

type Duration = "TWO_HOUR" | "FOUR_HOUR" | "SIX_HOUR" | "EIGHT_HOUR";

const TIERS: { value: Duration; label: string; key: keyof BoatLite }[] = [
  { value: "TWO_HOUR", label: "2 hours", key: "price2hCents" },
  { value: "FOUR_HOUR", label: "4 hours", key: "price4hCents" },
  { value: "SIX_HOUR", label: "6 hours", key: "price6hCents" },
  { value: "EIGHT_HOUR", label: "8 hours", key: "price8hCents" },
];

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function formatTimeLabel(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function BookingForm({
  boat,
  depositPercent,
  todayInTz,
}: {
  boat: BoatLite;
  depositPercent: number;
  todayInTz: string;
}) {
  const router = useRouter();
  const [duration, setDuration] = useState<Duration>("FOUR_HOUR");
  const [date, setDate] = useState<string>(todayInTz);
  const [slot, setSlot] = useState<string>("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceCents = boat[TIERS.find((t) => t.value === duration)!.key] as number;
  const depositCents = useMemo(
    () => Math.round((priceCents * depositPercent) / 100),
    [priceCents, depositPercent]
  );

  // Fetch slots whenever boat/date/duration changes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setSlotsLoading(true);
      setSlotsError(null);
      try {
        const params = new URLSearchParams({ boatId: boat.id, date, duration });
        const res = await fetch(`/api/availability?${params.toString()}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Could not load slots");
        setSlots(data.slots);
        // Reset slot if no longer available
        setSlot((prev) => (data.slots.includes(prev) ? prev : ""));
      } catch (err) {
        if (!cancelled) setSlotsError(err instanceof Error ? err.message : "Could not load slots");
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [boat.id, date, duration]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot) {
      setError("Please pick a start time.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boatId: boat.id,
          fullName,
          email,
          phone,
          notes,
          duration,
          date,
          time: slot,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create booking.");
      router.push(`/book/waiver/${data.bookingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  // Compute the minimum date selectable (today)
  const minDate = todayInTz;
  // Reasonable max: 6 months out
  const maxDate = useMemo(() => {
    const d = new Date(todayInTz + "T12:00:00Z");
    d.setUTCMonth(d.getUTCMonth() + 6);
    return d.toISOString().slice(0, 10);
  }, [todayInTz]);

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-6">
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-navy-800">1. Choose duration</h2>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TIERS.map((t) => {
            const c = boat[t.key] as number;
            const active = duration === t.value;
            return (
              <button
                type="button"
                key={t.value}
                onClick={() => setDuration(t.value)}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  active
                    ? "border-navy-600 bg-navy-50 ring-2 ring-navy-600/20"
                    : "border-navy-200 bg-white hover:border-navy-400"
                }`}
              >
                <div className="text-xs uppercase tracking-wide text-navy-500">{t.label}</div>
                <div className="mt-1 font-semibold text-navy-800">{fmt(c)}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-navy-800">2. Pick a date &amp; start time</h2>
        <p className="mt-1 text-sm text-navy-600">All times shown in Eastern Time (ET).</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-[220px_1fr]">
          <div>
            <label className="label" htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              required
              min={minDate}
              max={maxDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Available start times</label>
            {slotsLoading ? (
              <p className="text-sm text-navy-500">Loading available slots…</p>
            ) : slotsError ? (
              <p className="text-sm text-rose-700">{slotsError}</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-navy-600">
                No availability for this duration on {date}. Try a different date or duration.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
                {slots.map((s) => {
                  const active = slot === s;
                  return (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSlot(s)}
                      className={`rounded-lg border px-2 py-2 text-sm transition ${
                        active
                          ? "border-navy-600 bg-navy-600 text-white"
                          : "border-navy-200 bg-white text-navy-800 hover:border-navy-400"
                      }`}
                    >
                      {formatTimeLabel(s)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-navy-800">3. Your details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="fullName">Full name</label>
            <input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="notes">Notes (optional)</label>
            <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="input" />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-navy-800">4. Review &amp; continue</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-navy-50 px-3 py-2">
            <dt className="text-navy-500 uppercase tracking-wide text-xs">Rental</dt>
            <dd className="font-semibold text-navy-800">{fmt(priceCents)}</dd>
          </div>
          <div className="rounded-lg bg-navy-50 px-3 py-2">
            <dt className="text-navy-500 uppercase tracking-wide text-xs">Deposit ({depositPercent}%)</dt>
            <dd className="font-semibold text-navy-800">{fmt(depositCents)}</dd>
          </div>
          <div className="rounded-lg bg-navy-50 px-3 py-2 col-span-2">
            <dt className="text-navy-500 uppercase tracking-wide text-xs">When</dt>
            <dd className="font-semibold text-navy-800">
              {slot ? `${date} at ${formatTimeLabel(slot)} ET` : <span className="text-navy-400">Pick a time above</span>}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-navy-600">
          Final pricing is calculated server-side from current rates. The next step is the waiver, then Stripe deposit.
        </p>
        {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
        <button type="submit" disabled={submitting || !slot} className="btn-primary mt-4">
          {submitting ? "Submitting…" : "Continue to waiver"}
        </button>
      </div>
    </form>
  );
}
