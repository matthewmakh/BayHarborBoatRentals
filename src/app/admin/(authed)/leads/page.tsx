import { prisma } from "@/lib/prisma";
import { LeadsManager } from "./LeadsManager";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const where = searchParams.status && ["open", "converted", "stale"].includes(searchParams.status)
    ? { status: searchParams.status as "open" | "converted" | "stale" }
    : undefined;

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { boat: { select: { name: true, slug: true } } },
  });

  const counts = await prisma.lead.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));

  return (
    <div className="container-x py-10">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif text-navy-800">Leads</h1>
          <p className="text-navy-600">Visitors who shared their contact info but haven't (yet) booked.</p>
        </div>
        <a href="/api/admin/leads/export" className="btn-secondary text-sm">⬇ Export CSV</a>
      </div>
      <LeadsManager
        currentStatus={searchParams.status ?? "all"}
        counts={{
          all: counts.reduce((s, c) => s + c._count._all, 0),
          open: countMap.open ?? 0,
          converted: countMap.converted ?? 0,
          stale: countMap.stale ?? 0,
        }}
        initial={leads.map((l) => ({
          id: l.id,
          createdAt: l.createdAt.toISOString(),
          fullName: l.fullName,
          phone: l.phone,
          email: l.email,
          notes: l.notes,
          source: l.source,
          status: l.status,
          boatName: l.boat?.name ?? null,
          bookingId: l.bookingId,
          ipAddress: l.ipAddress,
        }))}
      />
    </div>
  );
}
