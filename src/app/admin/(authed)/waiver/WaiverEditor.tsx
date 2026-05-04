"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WaiverEditor({ activeBody, activeVersion }: { activeBody: string; activeVersion: number }) {
  const router = useRouter();
  const [body, setBody] = useState(activeBody);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function publish() {
    if (body.trim().length < 50) {
      setErr("Waiver body looks too short.");
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/waiver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Publish failed");
      setMsg(`Published v${data.version}. Past submissions remain linked to their original version.`);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 card p-6">
      <p className="text-sm text-navy-600">Currently active: v{activeVersion || "—"}</p>
      <textarea
        rows={14}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="input mt-3 font-mono text-sm"
      />
      <div className="mt-3 flex items-center gap-3">
        <button onClick={publish} disabled={busy} className="btn-primary">{busy ? "Publishing…" : "Publish new version"}</button>
        {msg && <span className="text-sm text-emerald-700">{msg}</span>}
        {err && <span className="text-sm text-rose-700">{err}</span>}
      </div>
    </div>
  );
}
