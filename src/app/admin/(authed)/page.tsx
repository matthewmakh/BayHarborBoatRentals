import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatUSD } from "@/lib/pricing";
import { getAllSettings, SETTING_KEYS } from "@/lib/settings";
import { isStripeConfigured } from "@/lib/stripe";

export default async function AdminDashboard() {
  const [boatCount, bookingCount, depositPaidCount, totalCents, recentBookings, settings] = await Promise.all([
    prisma.boat.count(),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "deposit_paid" } }),
    prisma.stripePayment.aggregate({ _sum: { amountCents: true }, where: { status: "succeeded" } }),
    prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { boat: true, payment: true },
    }),
    getAllSettings(),
  ]);

  const stripeReady = isStripeConfigured();
  const instant = settings[SETTING_KEYS.instantReservationsEnabled] === "true";
  const operatingHours = `${settings[SETTING_KEYS.operatingHoursStart]}–${settings[SETTING_KEYS.operatingHoursEnd]} ET`;

  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-serif text-navy-800">Dashboard</h1>
      <p className="mt-1 text-navy-600">Quick overview and shortcuts.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Boats" value={boatCount.toString()} />
        <Stat label="Total bookings" value={bookingCount.toString()} />
        <Stat label="Deposits paid" value={depositPaidCount.toString()} />
        <Stat label="Stripe revenue" value={formatUSD(totalCents._sum.amountCents ?? 0)} />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <ConfigCard title="Stripe" ok={stripeReady} okText="Connected" warnText="Not configured — see README" />
        <ConfigCard title="Operating hours" ok okText={operatingHours} warnText="" />
        <ConfigCard
          title="Instant reservations"
          ok={instant}
          okText="Enabled"
          warnText="Disabled — customers will be asked to call"
          neutral
        />
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-navy-800">Recent bookings</h2>
          <Link href="/admin/bookings" className="text-sm text-navy-600 hover:text-navy-800">All bookings →</Link>
        </div>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-navy-50/60 text-navy-700">
              <tr>
                <Th>When</Th><Th>Customer</Th><Th>Boat</Th><Th>Duration</Th><Th>Deposit</Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b.id} className="border-t border-navy-100">
                  <Td>{b.createdAt.toLocaleDateString()}</Td>
                  <Td>{b.fullName}<div className="text-xs text-navy-500">{b.email}</div></Td>
                  <Td>{b.boat.name}</Td>
                  <Td>{b.duration.replace("_", " ").toLowerCase()}</Td>
                  <Td>{formatUSD(b.depositCents)}</Td>
                  <Td><span className="badge">{b.status}</span></Td>
                </tr>
              ))}
              {recentBookings.length === 0 && (
                <tr><Td colSpan={6}><span className="text-navy-500">No bookings yet.</span></Td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
      <div className="text-xs uppercase tracking-wider text-navy-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-navy-800">{value}</div>
    </div>
  );
}

function ConfigCard({ title, ok, okText, warnText, neutral }: { title: string; ok: boolean; okText: string; warnText: string; neutral?: boolean }) {
  const cls = ok
    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
    : neutral
    ? "bg-amber-50 text-amber-800 border-amber-200"
    : "bg-amber-50 text-amber-800 border-amber-200";
  return (
    <div className={`rounded-2xl border p-5 ${cls}`}>
      <h3 className="text-sm font-semibold uppercase tracking-wide">{title}</h3>
      <p className="mt-2 text-sm">{ok ? okText : warnText}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-medium px-4 py-2">{children}</th>;
}
function Td({ children, colSpan }: { children: React.ReactNode; colSpan?: number }) {
  return <td className="px-4 py-3 align-top" colSpan={colSpan}>{children}</td>;
}
