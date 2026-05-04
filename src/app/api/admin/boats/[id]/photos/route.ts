import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const AddSchema = z.object({ url: z.string().url(), alt: z.string().max(200).optional() });
const ReorderSchema = z.object({ order: z.array(z.string().min(1)) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = AddSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const exists = await prisma.boat.findUnique({ where: { id: params.id } });
  if (!exists) return NextResponse.json({ error: "Boat not found" }, { status: 404 });

  const max = await prisma.boatPhoto.findFirst({
    where: { boatId: params.id },
    orderBy: { sortOrder: "desc" },
  });
  const photo = await prisma.boatPhoto.create({
    data: {
      boatId: params.id,
      url: parsed.data.url,
      alt: parsed.data.alt,
      sortOrder: (max?.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json({ id: photo.id });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = ReorderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const ids = parsed.data.order;
  await prisma.$transaction(
    ids.map((id, i) =>
      prisma.boatPhoto.updateMany({
        where: { id, boatId: params.id },
        data: { sortOrder: i },
      })
    )
  );
  return NextResponse.json({ ok: true });
}
