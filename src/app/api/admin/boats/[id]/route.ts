import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const Schema = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: z.string().min(1).max(80).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  lengthFeet: z.number().int().min(1).max(500).optional(),
  maxCapacity: z.number().int().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(["available", "unavailable", "maintenance"]).optional(),
  price2hCents: z.number().int().min(0).optional(),
  price4hCents: z.number().int().min(0).optional(),
  price6hCents: z.number().int().min(0).optional(),
  price8hCents: z.number().int().min(0).optional(),
  depositPercentOverride: z.number().int().min(0).max(100).nullable().optional(),
  sortOrder: z.number().int().optional(),
  ownerName: z.string().max(160).nullable().optional(),
  ownerEmail: z.string().max(200).email().or(z.literal("")).nullable().optional(),
  ownerPhone: z.string().max(40).nullable().optional(),
  ownerNotes: z.string().max(4000).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const data = { ...parsed.data };
  if (data.slug) {
    const desired = slugify(data.slug);
    let slug = desired;
    let n = 1;
    while (true) {
      const existing = await prisma.boat.findUnique({ where: { slug } });
      if (!existing || existing.id === params.id) break;
      slug = `${desired}-${++n}`;
    }
    data.slug = slug;
  }
  try {
    const updated = await prisma.boat.update({ where: { id: params.id }, data });
    return NextResponse.json({ id: updated.id, slug: updated.slug });
  } catch {
    return NextResponse.json({ error: "Boat not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const bookingsCount = await prisma.booking.count({ where: { boatId: params.id } });
  if (bookingsCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete a boat that has bookings. Set its status to Unavailable instead." },
      { status: 409 }
    );
  }
  try {
    await prisma.boat.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Boat not found" }, { status: 404 });
  }
}
