"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "bhbr_cbw_dismissed";

export function CallbackWidget() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Hide on admin
    if (window.location.pathname.startsWith("/admin")) return;
    const dismissedAt = parseInt(localStorage.getItem(DISMISSED_KEY) || "0", 10);
    // Re-show after 7 days
    if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    setHidden(false);
  }, []);

  if (hidden) return null;

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setOpen(false);
    setHidden(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name, phone, notes, source: "callback_widget" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      setDone(true);
      setTimeout(() => {
        dismiss();
        setDone(false);
      }, 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 print:hidden">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex items-center gap-2 rounded-full bg-navy-600 text-white px-5 py-3 shadow-2xl hover:bg-navy-700 transition"
        >
          <span aria-hidden="true">📞</span>
          <span className="text-sm font-semibold">Get a callback</span>
        </button>
      )}
      {open && (
        <div className="w-[320px] sm:w-[360px] rounded-2xl bg-white shadow-2xl border border-navy-100 overflow-hidden">
          <div className="bg-navy-700 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">No pressure</p>
              <p className="text-sm font-semibold">Tell us when to call</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-xl leading-none" aria-label="Close">×</button>
          </div>
          {done ? (
            <div className="p-5 text-center">
              <div className="text-3xl mb-2">✓</div>
              <p className="text-navy-800 font-semibold">Got it — we'll call you back shortly.</p>
              <p className="mt-1 text-sm text-navy-600">Or call us anytime at 516-974-8874.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="p-4 grid gap-3">
              <input className="input" placeholder="Your name" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              <input className="input" type="tel" placeholder="Phone number" required value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
              <textarea className="input" rows={2} placeholder="What are you interested in? (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
              {error && <p className="text-xs text-rose-700">{error}</p>}
              <button className="btn-primary w-full justify-center" disabled={submitting}>
                {submitting ? "Sending…" : "Request callback"}
              </button>
              <button type="button" onClick={dismiss} className="text-xs text-navy-500 hover:text-navy-700">
                Don't show this again
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
