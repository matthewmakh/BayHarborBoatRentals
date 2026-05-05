"use client";

import { useState } from "react";

export function ContactCallbackForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name, phone, notes, source: "contact_section" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-card">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-navy-600">Request a callback</h3>
      <p className="mt-1 text-sm text-navy-700">Drop your name and number — we'll reach out the same day.</p>
      {done ? (
        <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800">
          <div className="flex items-center gap-2 font-semibold">
            <span aria-hidden="true">✓</span> We'll call you back shortly.
          </div>
          <p className="mt-1 text-sm">Or call us anytime at the number on the left.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-4 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder="Your name" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            <input className="input" type="tel" placeholder="Phone number" required value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </div>
          <textarea className="input" rows={2} placeholder="Anything you'd like us to know? (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          {error && <p className="text-xs text-rose-700">{error}</p>}
          <button className="btn-primary justify-center" disabled={submitting}>
            {submitting ? "Sending…" : "Request callback"}
          </button>
        </form>
      )}
    </div>
  );
}
