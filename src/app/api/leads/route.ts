import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrCreateLeadId } from "@/lib/leadCookie";
import { getClientIp } from "@/lib/clientIp";
import { notifyLeadCaptured } from "@/lib/notifications";

const Schema = z.object({
  fullName: z.string().max(160).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().email().max(200).optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
  boatId: z.string().min(1).max(40).optional(),
  source: z.enum(["booking_form", "contact_section", "callback_widget"]),
});

const MIN_NAME = 2;
const MIN_PHONE_DIGITS = 7;

function digits(s?: string): number {
  return (s || "").replace(/\D/g, "").length;
}

function clean<T extends Record<string, unknown>>(o: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v !== undefined && v !== "") (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

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

  // Don't write garbage rows — require enough info to actually call them back.
  if ((data.fullName?.trim().length ?? 0) < MIN_NAME || digits(data.phone) < MIN_PHONE_DIGITS) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const leadId = getOrCreateLeadId();
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || undefined;

  // Validate boatId exists if supplied (otherwise the relation insert errors).
  let boatId: string | undefined = data.boatId;
  if (boatId) {
    const exists = await prisma.boat.findUnique({ where: { id: boatId }, select: { id: true } });
    if (!exists) boatId = undefined;
  }

  const updateData = clean({
    fullName: data.fullName?.trim(),
    phone: data.phone?.trim(),
    email: data.email?.trim(),
    notes: data.notes?.trim(),
    boatId,
    ipAddress: ip,
    userAgent,
  });

  const before = await prisma.lead.findUnique({ where: { id: leadId } });

  const lead = await prisma.lead.upsert({
    where: { id: leadId },
    update: updateData,
    create: {
      id: leadId,
      source: data.source,
      ...updateData,
    },
  });

  // Fire notification only on the first transition from "no contact info" -> "has contact info".
  const hadContactBefore = before && (before.fullName || before.phone);
  if (!hadContactBefore && !lead.notifiedAt) {
    notifyLeadCaptured(lead).catch(() => undefined);
    await prisma.lead
      .update({ where: { id: lead.id }, data: { notifiedAt: new Date() } })
      .catch(() => undefined);
  }

  return NextResponse.json({ ok: true, leadId: lead.id });
}
