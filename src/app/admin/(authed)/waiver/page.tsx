import { prisma } from "@/lib/prisma";
import { WaiverEditor } from "./WaiverEditor";

export const dynamic = "force-dynamic";

export default async function AdminWaiverPage() {
  const versions = await prisma.waiverVersion.findMany({
    orderBy: { version: "desc" },
    include: { _count: { select: { submissions: true } } },
  });
  const active = versions.find((v) => v.isActive) ?? versions[0];

  const submissions = await prisma.waiverSubmission.findMany({
    take: 30,
    orderBy: { signedAt: "desc" },
    include: { booking: { include: { boat: true } }, waiverVersion: true },
  });

  return (
    <div className="container-x py-10 grid gap-10">
      <section>
        <h1 className="text-3xl font-serif text-navy-800">Waiver</h1>
        <p className="text-navy-600">Edit the universal waiver. Saving creates a new active version — past submissions remain linked to their version.</p>
        <WaiverEditor activeBody={active?.body ?? ""} activeVersion={active?.version ?? 0} />
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-navy-800">Versions</h2>
          <ul className="mt-2 grid gap-2 text-sm">
            {versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between rounded-lg bg-white border border-navy-100 px-4 py-2">
                <span>v{v.version} {v.isActive && <span className="badge ml-2">active</span>}</span>
                <span className="text-navy-500">{v._count.submissions} submission{v._count.submissions === 1 ? "" : "s"} · {v.createdAt.toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-serif text-navy-800">Recent submissions</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-navy-50/60 text-navy-700">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Signed</th>
                <th className="text-left px-4 py-2 font-medium">Name</th>
                <th className="text-left px-4 py-2 font-medium">Boat</th>
                <th className="text-left px-4 py-2 font-medium">Version</th>
                <th className="text-left px-4 py-2 font-medium">IP</th>
                <th className="text-left px-4 py-2 font-medium">Booking</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-t border-navy-100">
                  <td className="px-4 py-3">{s.signedAt.toLocaleString()}</td>
                  <td className="px-4 py-3">{s.fullLegalName}</td>
                  <td className="px-4 py-3">{s.booking.boat.name}</td>
                  <td className="px-4 py-3">v{s.waiverVersion.version}</td>
                  <td className="px-4 py-3 text-navy-500">{s.ipAddress || "—"}</td>
                  <td className="px-4 py-3"><a className="text-navy-700 underline" href={`/admin/bookings/${s.bookingId}`}>open</a></td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-navy-500">No submissions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
