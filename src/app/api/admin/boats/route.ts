import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const Schema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(80).optional(),
  year: z.number().int().min(1900).max(2100),
  lengthFeet: z.number().int().min(1).max(500),
  maxCapacity: z.number().int().min(1).max(200),
  description: z.string().min(1),
  status: z.enum(["available", "unavailable", "maintenance"]),
  price2hCents: z.number().int().min(0),
  price4hCents: z.number().int().min(0),
  price6hCents: z.number().int().min(0),
  price8hCents: z.number().int().min(0),
  depositPercentOverride: z.number().int().min(0).max(100).nullable().optional(),
  sortOrder: z.number().int().default(0),
});

export async function POST(req: Request) {
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
  const data = parsed.data;
  const baseSlug = slugify(data.slug || data.name);
  let slug = baseSlug || `boat-${Date.now()}`;
  let n = 1;
  while (await prisma.boat.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++n}`;
  }
  const created = await prisma.boat.create({ data: { ...data, slug } });
  return NextResponse.json({ id: created.id, slug: created.slug });
}
