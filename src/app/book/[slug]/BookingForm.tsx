"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLeadCapture } from "@/lib/useLeadCapture";

type BoatLite = {
  id: string;
  slug: string;
  name: string;
  year: number;
  lengthFeet: number;
  maxCapacity: number;
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

function prettyDate(d: string): string {
  // d = "YYYY-MM-DD"; render in business TZ as "Sat, Jun 14"
  const [y, mo, day] = d.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(y, mo - 1, day, 12)));
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
  const captureLead = useLeadCapture();

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

  // Prefill from any existing lead cookie
  useEffect(() => {
    let cancelled = false;
    fetch("/api/leads/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d?.lead) return;
        if (d.lead.fullName && !fullName) setFullName(d.lead.fullName);
        if (d.lead.phone && !phone) setPhone(d.lead.phone);
        if (d.lead.email && !email) setEmail(d.lead.email);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function captureNow() {
    captureLead({
      fullName,
      phone,
      email: email || undefined,
      boatId: boat.id,
      source: "booking_form",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot) {
      setError("Please pick a date and start time first.");
      document.getElementById("step-time")?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const minDate = todayInTz;
  const maxDate = useMemo(() => {
    const d = new Date(todayInTz + "T12:00:00Z");
    d.setUTCMonth(d.getUTCMonth() + 6);
    return d.toISOString().slice(0, 10);
  }, [todayInTz]);

  const detailsComplete = fullName.trim().length >= 2 && phone.trim().length >= 7;
  const timeComplete = Boolean(slot);

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
      <div className="grid gap-6">
        {/* Boat header strip */}
        <div className="card overflow-hidden flex">
          {boat.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={boat.photo} alt={boat.name} className="hidden sm:block w-32 h-28 object-cover" />
          )}
          <div className="flex-1 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-navy-500">You're booking</p>
              <h2 className="text-xl font-serif text-navy-800">{boat.name}</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="badge">{boat.year}</span>
              <span className="badge">{boat.lengthFeet}ft</span>
              <span className="badge">Up to {boat.maxCapacity} guests</span>
            </div>
          </div>
        </div>

        {/* Step 1 — Duration */}
        <Step number={1} title="Choose duration" complete>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
        </Step>

        {/* Step 2 — Your details (moved up to capture leads earlier) */}
        <Step number={2} title="Your details" complete={detailsComplete}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={captureNow}
                className="input"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="label" htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={captureNow}
                className="input"
                autoComplete="tel"
                placeholder="(305) 555-1234"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={captureNow}
                className="input"
                autoComplete="email"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="notes">Notes (optional)</label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input"
                placeholder="Anything we should know — group size, special occasion, etc."
              />
            </div>
          </div>
        </Step>

        {/* Step 3 — Date & start time */}
        <div id="step-time" className="scroll-mt-24">
          <Step number={3} title="Pick a date & start time" complete={timeComplete} subtitle="All times shown in Eastern Time (ET).">
            <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
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
                  <div className="text-sm text-navy-700 space-y-2">
                    <p>No openings for a {TIERS.find((t) => t.value === duration)!.label.toLowerCase()} rental on {date}.</p>
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Date(date + "T12:00:00Z");
                        next.setUTCDate(next.getUTCDate() + 1);
                        setDate(next.toISOString().slice(0, 10));
                      }}
                      className="rounded-lg bg-navy-50 border border-navy-200 px-3 py-1.5 text-navy-800 hover:bg-navy-100"
                    >
                      Try tomorrow →
                    </button>
                  </div>
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
          </Step>
        </div>

        {/* Step 4 (mobile only) — Review */}
        <div className="lg:hidden">
          <SummaryCard
            boat={boat}
            duration={duration}
            date={date}
            slot={slot}
            priceCents={priceCents}
            depositCents={depositCents}
            depositPercent={depositPercent}
            submitting={submitting}
            error={error}
          />
        </div>
      </div>

      {/* Sticky summary (desktop) */}
      <aside className="hidden lg:block lg:sticky lg:top-24">
        <SummaryCard
          boat={boat}
          duration={duration}
          date={date}
          slot={slot}
          priceCents={priceCents}
          depositCents={depositCents}
          depositPercent={depositPercent}
          submitting={submitting}
          error={error}
        />
      </aside>
    </form>
  );
}

function Step({
  number,
  title,
  subtitle,
  complete,
  children,
}: {
  number: number;
  title: string;
  subtitle?: string;
  complete?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 grid h-8 w-8 place-items-center rounded-full text-sm font-semibold transition ${
            complete ? "bg-emerald-500 text-white" : "bg-navy-100 text-navy-700"
          }`}
        >
          {complete ? "✓" : number}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-navy-800">{title}</h3>
          {subtitle && <p className="text-sm text-navy-600 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SummaryCard({
  boat,
  duration,
  date,
  slot,
  priceCents,
  depositCents,
  depositPercent,
  submitting,
  error,
}: {
  boat: { name: string; photo: string | null };
  duration: Duration;
  date: string;
  slot: string;
  priceCents: number;
  depositCents: number;
  depositPercent: number;
  submitting: boolean;
  error: string | null;
}) {
  const durLabel = TIERS.find((t) => t.value === duration)!.label;
  return (
    <div className="card overflow-hidden">
      {boat.photo && (
        <div className="aspect-[4/3] bg-navy-50 lg:aspect-[16/9]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={boat.photo} alt={boat.name} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-navy-500">Your trip</p>
        <h3 className="mt-1 font-serif text-xl text-navy-800">{boat.name}</h3>

        <dl className="mt-4 grid gap-2 text-sm">
          <SummaryRow label="Duration" value={durLabel} />
          <SummaryRow
            label="When"
            value={slot ? `${prettyDate(date)} · ${formatTimeLabel(slot)} ET` : "—"}
            muted={!slot}
          />
        </dl>

        <div className="mt-4 rounded-xl bg-navy-50 p-3 grid gap-1 text-sm">
          <div className="flex justify-between"><span className="text-navy-600">Rental total</span><span className="font-semibold text-navy-800">{fmt(priceCents)}</span></div>
          <div className="flex justify-between"><span className="text-navy-600">Deposit ({depositPercent}%)</span><span className="font-semibold text-navy-800">{fmt(depositCents)}</span></div>
          <div className="flex justify-between border-t border-navy-200 pt-1 mt-1"><span className="text-navy-600">Balance on arrival</span><span className="font-semibold text-navy-800">{fmt(priceCents - depositCents)}</span></div>
        </div>

        <div className="mt-4 text-xs text-navy-600 leading-relaxed">
          🔒 Stripe-secured deposit. Free reschedule up to 48 hrs before. Refund if we cancel for weather.
        </div>

        {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          aria-disabled={!slot || undefined}
          className="btn-primary w-full justify-center mt-4"
        >
          {submitting ? "Submitting…" : slot ? "Continue to waiver" : "Pick a time to continue"}
        </button>
        <p className="mt-2 text-center text-[11px] text-navy-500">Next: sign waiver, then deposit.</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-navy-500">{label}</dt>
      <dd className={`text-right ${muted ? "text-navy-400" : "text-navy-800 font-medium"}`}>{value}</dd>
    </div>
  );
}
