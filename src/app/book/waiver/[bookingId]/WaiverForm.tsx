"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WaiverForm({ bookingId, waiverVersion }: { bookingId: string; waiverVersion: number }) {
  const router = useRouter();
  const [legalName, setLegalName] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmed) {
      setError("You must confirm the waiver to continue.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/waiver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, fullLegalName: legalName, confirmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save waiver.");
      router.push(`/book/payment/${bookingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 card p-6">
      <p className="text-xs uppercase tracking-wide text-navy-500">Waiver version {waiverVersion}</p>
      <label className="mt-4 flex gap-3 items-start text-sm text-navy-800">
        <input
          type="checkbox"
          required
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-navy-300"
        />
        <span>I have read and agree to the rental waiver and assumption of risk above.</span>
      </label>
      <div className="mt-4">
        <label htmlFor="legalName" className="label">Full legal name</label>
        <input
          id="legalName"
          required
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          className="input"
          placeholder="As shown on your ID"
        />
      </div>
      {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
      <button type="submit" disabled={submitting} className="btn-primary mt-4">
        {submitting ? "Saving…" : "Sign and continue to deposit"}
      </button>
    </form>
  );
}
