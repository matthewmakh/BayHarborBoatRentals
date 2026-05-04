import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatUSD } from "@/lib/pricing";

export default async function AdminBoatsPage() {
  const boats = await prisma.boat.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { photos: true } } },
  });
  return (
    <div className="container-x py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif text-navy-800">Boats</h1>
        <Link href="/admin/boats/new" className="btn-primary text-sm">Add boat</Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-navy-50/60 text-navy-700">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Year</th>
              <th className="text-left px-4 py-2 font-medium">Length</th>
              <th className="text-left px-4 py-2 font-medium">Cap.</th>
              <th className="text-left px-4 py-2 font-medium">2/4/6/8 hr</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Photos</th>
              <th className="text-left px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {boats.map((b) => (
              <tr key={b.id} className="border-t border-navy-100">
                <td className="px-4 py-3 font-medium text-navy-800">{b.name}<div className="text-xs text-navy-500">/{b.slug}</div></td>
                <td className="px-4 py-3">{b.year}</td>
                <td className="px-4 py-3">{b.lengthFeet}ft</td>
                <td className="px-4 py-3">{b.maxCapacity}</td>
                <td className="px-4 py-3 text-xs">{formatUSD(b.price2hCents)} / {formatUSD(b.price4hCents)} / {formatUSD(b.price6hCents)} / {formatUSD(b.price8hCents)}</td>
                <td className="px-4 py-3"><span className="badge">{b.status}</span></td>
                <td className="px-4 py-3">{b._count.photos}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/boats/${b.id}`} className="text-navy-700 hover:text-navy-900 font-medium">Edit</Link>
                </td>
              </tr>
            ))}
            {boats.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-navy-500">No boats yet — click "Add boat" to create your first.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
