import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { durationLabel, formatUSD } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function AdminBookings() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: { boat: true, payment: true, waiver: true },
    take: 100,
  });

  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-serif text-navy-800">Bookings</h1>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-navy-50/60 text-navy-700">
            <tr>
              <th className="text-left px-4 py-2 font-medium">When</th>
              <th className="text-left px-4 py-2 font-medium">Customer</th>
              <th className="text-left px-4 py-2 font-medium">Boat</th>
              <th className="text-left px-4 py-2 font-medium">Duration</th>
              <th className="text-left px-4 py-2 font-medium">Rental</th>
              <th className="text-left px-4 py-2 font-medium">Deposit</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Stripe</th>
              <th className="text-left px-4 py-2 font-medium">Waiver</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-navy-100">
                <td className="px-4 py-3 text-navy-600">{b.createdAt.toLocaleString()}</td>
                <td className="px-4 py-3">{b.fullName}<div className="text-xs text-navy-500">{b.email}<br/>{b.phone}</div></td>
                <td className="px-4 py-3">{b.boat.name}</td>
                <td className="px-4 py-3">{durationLabel(b.duration)}</td>
                <td className="px-4 py-3">{formatUSD(b.rentalPriceCents)}</td>
                <td className="px-4 py-3">{formatUSD(b.depositCents)}</td>
                <td className="px-4 py-3"><span className="badge">{b.status}</span></td>
                <td className="px-4 py-3 text-xs">
                  {b.payment ? (
                    <>
                      <div>{b.payment.status}</div>
                      <div className="text-navy-500">{formatUSD(b.payment.amountCents)}</div>
                    </>
                  ) : <span className="text-navy-400">—</span>}
                </td>
                <td className="px-4 py-3 text-xs">{b.waiver ? "✓ Signed" : "—"}</td>
                <td className="px-4 py-3"><Link className="text-navy-700 font-medium hover:text-navy-900" href={`/admin/bookings/${b.id}`}>View</Link></td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-6 text-navy-500">No bookings yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
