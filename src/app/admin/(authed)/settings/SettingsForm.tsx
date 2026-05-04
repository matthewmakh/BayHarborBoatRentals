"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  businessName: string;
  phone: string;
  email: string;
  address: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  calendlyUrl: string;
  depositPercent: string;
  instantReservationsEnabled: boolean;
  paymentMethodsText: string;
  licensedInsuredText: string;
  heroHeadline: string;
  heroSubheadline: string;
};

export function SettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [s, setS] = useState<Initial>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function set<K extends keyof Initial>(k: K, v: Initial[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: s.businessName,
          phone: s.phone,
          email: s.email,
          address: s.address,
          instagram_url: s.instagramUrl,
          facebook_url: s.facebookUrl,
          tiktok_url: s.tiktokUrl,
          calendly_url: s.calendlyUrl,
          deposit_percent: s.depositPercent,
          instant_reservations_enabled: s.instantReservationsEnabled ? "true" : "false",
          payment_methods_text: s.paymentMethodsText,
          licensed_insured_text: s.licensedInsuredText,
          hero_headline: s.heroHeadline,
          hero_subheadline: s.heroSubheadline,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMsg("Saved.");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-6 grid gap-6">
      <Section title="Business">
        <Field label="Business name"><input className="input" value={s.businessName} onChange={(e) => set("businessName", e.target.value)} /></Field>
        <Field label="Phone"><input className="input" value={s.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="Email"><input className="input" type="email" value={s.email} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="Address" full><input className="input" value={s.address} onChange={(e) => set("address", e.target.value)} /></Field>
      </Section>

      <Section title="Hero">
        <Field label="Hero headline" full><input className="input" value={s.heroHeadline} onChange={(e) => set("heroHeadline", e.target.value)} /></Field>
        <Field label="Hero subheadline" full><textarea className="input" rows={2} value={s.heroSubheadline} onChange={(e) => set("heroSubheadline", e.target.value)} /></Field>
        <Field label="Licensed & insured text" full><input className="input" value={s.licensedInsuredText} onChange={(e) => set("licensedInsuredText", e.target.value)} /></Field>
      </Section>

      <Section title="Reservations">
        <Field label="Default deposit %"><input type="number" min={0} max={100} className="input" value={s.depositPercent} onChange={(e) => set("depositPercent", e.target.value)} /></Field>
        <Field label="Calendly URL"><input className="input" value={s.calendlyUrl} onChange={(e) => set("calendlyUrl", e.target.value)} placeholder="https://calendly.com/your/handle" /></Field>
        <Field label="Instant reservations" full>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={s.instantReservationsEnabled} onChange={(e) => set("instantReservationsEnabled", e.target.checked)} />
            Allow customers to reserve, sign waiver, and pay deposit instantly. When off, customers see a "call to reserve" prompt.
          </label>
        </Field>
        <Field label="Payment methods text" full><textarea rows={2} className="input" value={s.paymentMethodsText} onChange={(e) => set("paymentMethodsText", e.target.value)} /></Field>
      </Section>

      <Section title="Social links (optional)">
        <Field label="Instagram URL"><input className="input" value={s.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} /></Field>
        <Field label="Facebook URL"><input className="input" value={s.facebookUrl} onChange={(e) => set("facebookUrl", e.target.value)} /></Field>
        <Field label="TikTok URL"><input className="input" value={s.tiktokUrl} onChange={(e) => set("tiktokUrl", e.target.value)} /></Field>
      </Section>

      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save settings"}</button>
        {msg && <span className="text-sm text-emerald-700">{msg}</span>}
        {err && <span className="text-sm text-rose-700">{err}</span>}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-navy-800">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
