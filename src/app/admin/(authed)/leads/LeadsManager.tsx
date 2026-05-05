"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Lead = {
  id: string;
  createdAt: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  source: "booking_form" | "contact_section" | "callback_widget";
  status: "open" | "converted" | "stale";
  boatName: string | null;
  bookingId: string | null;
  ipAddress: string | null;
};

const SOURCE_LABEL: Record<Lead["source"], string> = {
  booking_form: "Booking page",
  contact_section: "Contact section",
  callback_widget: "Callback widget",
};

const STATUS_STYLES: Record<Lead["status"], string> = {
  open: "bg-amber-50 text-amber-700 border-amber-200",
  converted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  stale: "bg-navy-100 text-navy-600 border-navy-200",
};

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export function LeadsManager({
  initial,
  counts,
  currentStatus,
}: {
  initial: Lead[];
  counts: { all: number; open: number; converted: number; stale: number };
  currentStatus: string;
}) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function setStatus(id: string, status: Lead["status"]) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/leads/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLeads((ls) => ls.filter((l) => l.id !== id));
      router.refresh();
    }
  }

  const filters: { value: string; label: string; count: number }[] = [
    { value: "all", label: "All", count: counts.all },
    { value: "open", label: "Open", count: counts.open },
    { value: "converted", label: "Converted", count: counts.converted },
    { value: "stale", label: "Stale", count: counts.stale },
  ];

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = currentStatus === f.value;
          const href = f.value === "all" ? "/admin/leads" : `/admin/leads?status=${f.value}`;
          return (
            <Link
              key={f.value}
              href={href}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border transition ${
                active ? "bg-navy-600 text-white border-navy-600" : "bg-white text-navy-700 border-navy-200 hover:bg-navy-50"
              }`}
            >
              {f.label} <span className={active ? "text-white/70" : "text-navy-400"}>({f.count})</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-navy-50/60 text-navy-700">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Captured</th>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Phone</th>
              <th className="text-left px-4 py-2 font-medium">Email</th>
              <th className="text-left px-4 py-2 font-medium">Boat</th>
              <th className="text-left px-4 py-2 font-medium">Source</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => {
              const isExpanded = expandedId === l.id;
              return (
                <>
                  <tr
                    key={l.id}
                    className="border-t border-navy-100 cursor-pointer hover:bg-navy-50/30"
                    onClick={() => setExpandedId(isExpanded ? null : l.id)}
                  >
                    <td className="px-4 py-3 text-navy-600 text-xs">{fmtDate(l.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-navy-800">{l.fullName || <span className="text-navy-400">—</span>}</td>
                    <td className="px-4 py-3">
                      {l.phone ? (
                        <a className="text-navy-700 hover:text-navy-900" href={`tel:${l.phone.replace(/\D/g, "")}`} onClick={(e) => e.stopPropagation()}>
                          {l.phone}
                        </a>
                      ) : <span className="text-navy-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {l.email ? (
                        <a className="text-navy-700 hover:text-navy-900" href={`mailto:${l.email}`} onClick={(e) => e.stopPropagation()}>
                          {l.email}
                        </a>
                      ) : <span className="text-navy-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-navy-700">{l.boatName || <span className="text-navy-400">—</span>}</td>
                    <td className="px-4 py-3 text-xs text-navy-600">{SOURCE_LABEL[l.source]}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_STYLES[l.status]}`}>{l.status}</span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        className="rounded-md border border-navy-200 bg-white px-2 py-1 text-xs"
                        value={l.status}
                        onChange={(e) => setStatus(l.id, e.target.value as Lead["status"])}
                      >
                        <option value="open">Open</option>
                        <option value="converted">Converted</option>
                        <option value="stale">Stale</option>
                      </select>
                      <button
                        onClick={() => remove(l.id)}
                        className="ml-2 text-rose-700 hover:text-rose-900 text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={l.id + "-x"} className="bg-navy-50/40 border-t border-navy-100">
                      <td colSpan={8} className="px-4 py-4 text-sm text-navy-700">
                        <dl className="grid gap-2 sm:grid-cols-2">
                          <Field label="Notes">{l.notes || <span className="text-navy-400">—</span>}</Field>
                          <Field label="Lead ID"><code className="text-xs">{l.id}</code></Field>
                          <Field label="IP">{l.ipAddress || <span className="text-navy-400">—</span>}</Field>
                          <Field label="Booking">
                            {l.bookingId ? (
                              <Link href={`/admin/bookings/${l.bookingId}`} className="text-navy-700 underline">
                                {l.bookingId.slice(-8)}
                              </Link>
                            ) : <span className="text-navy-400">—</span>}
                          </Field>
                        </dl>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {leads.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-navy-500">No leads here yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-navy-500">{label}</dt>
      <dd className="mt-0.5 text-navy-800">{children}</dd>
    </div>
  );
}
