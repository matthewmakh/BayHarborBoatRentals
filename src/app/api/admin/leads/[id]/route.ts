import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const PatchSchema = z.object({
  status: z.enum(["open", "converted", "stale"]).optional(),
  notes: z.string().max(2000).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  try {
    await prisma.lead.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.lead.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
}
