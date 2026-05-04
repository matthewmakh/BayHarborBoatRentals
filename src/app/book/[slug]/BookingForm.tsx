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

export function BookingForm({
  boat,
  depositPercent,
  calendlyUrl,
}: {
  boat: BoatLite;
  depositPercent: number;
  calendlyUrl: string;
}) {
  const router = useRouter();
  const [duration, setDuration] = useState<Duration>("FOUR_HOUR");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [calendlyEventUri, setCalendlyEventUri] = useState<string>("");
  const [calendlyInviteeUri, setCalendlyInviteeUri] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceCents = boat[TIERS.find((t) => t.value === duration)!.key] as number;
  const depositCents = useMemo(
    () => Math.round((priceCents * depositPercent) / 100),
    [priceCents, depositPercent]
  );

  // Listen for Calendly's postMessage events (client-side enhancement)
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (typeof e.data !== "object" || !e.data) return;
      const ev = (e.data as { event?: string }).event;
      if (ev !== "calendly.event_scheduled") return;
      const payload = (e.data as { payload?: { event?: { uri?: string }; invitee?: { uri?: string } } }).payload;
      if (payload?.event?.uri) setCalendlyEventUri(payload.event.uri);
      if (payload?.invitee?.uri) setCalendlyInviteeUri(payload.invitee.uri);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
          calendlyEventUri: calendlyEventUri || undefined,
          calendlyInviteeUri: calendlyInviteeUri || undefined,
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

  const calendlySrc = calendlyUrl
    ? `${calendlyUrl}${calendlyUrl.includes("?") ? "&" : "?"}hide_event_type_details=0&hide_gdpr_banner=1${
        email ? `&email=${encodeURIComponent(email)}` : ""
      }${fullName ? `&name=${encodeURIComponent(fullName)}` : ""}`
    : "";

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
        <h2 className="text-lg font-semibold text-navy-800">2. Your details</h2>
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
        <h2 className="text-lg font-semibold text-navy-800">3. Pick a time</h2>
        <p className="mt-1 text-sm text-navy-700">Scheduling is handled through Calendly.</p>
        {calendlyUrl ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-navy-100">
            <iframe
              src={calendlySrc}
              className="w-full h-[680px]"
              title="Schedule with Calendly"
            />
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            Calendly URL not configured yet — admin can set it in /admin/settings.
          </p>
        )}
        {calendlyEventUri && (
          <p className="mt-3 text-sm text-emerald-700">✓ Time slot selected.</p>
        )}
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
        </dl>
        <p className="mt-3 text-xs text-navy-600">
          Final pricing is calculated server-side from current rates. The next step is the waiver, then Stripe deposit.
        </p>
        {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-primary mt-4">
          {submitting ? "Submitting…" : "Continue to waiver"}
        </button>
      </div>
    </form>
  );
}
