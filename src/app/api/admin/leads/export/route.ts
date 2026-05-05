import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function csvEscape(v: string | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: { boat: { select: { name: true } } },
  });

  const header = [
    "createdAt",
    "fullName",
    "phone",
    "email",
    "source",
    "status",
    "boat",
    "notes",
    "bookingId",
    "ipAddress",
    "leadId",
  ];

  const rows = leads.map((l) =>
    [
      l.createdAt.toISOString(),
      l.fullName,
      l.phone,
      l.email,
      l.source,
      l.status,
      l.boat?.name,
      l.notes,
      l.bookingId,
      l.ipAddress,
      l.id,
    ]
      .map(csvEscape)
      .join(",")
  );

  const csv = [header.join(","), ...rows].join("\n");
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bay-harbor-leads-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
