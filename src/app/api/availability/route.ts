import { NextResponse } from "next/server";
import { z } from "zod";
import { getAvailableSlots, getSchedulingConfig } from "@/lib/availability";
import { prisma } from "@/lib/prisma";

const Schema = z.object({
  boatId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  duration: z.enum(["TWO_HOUR", "FOUR_HOUR", "SIX_HOUR", "EIGHT_HOUR"]),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = Schema.safeParse({
    boatId: url.searchParams.get("boatId"),
    date: url.searchParams.get("date"),
    duration: url.searchParams.get("duration"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  const boat = await prisma.boat.findUnique({ where: { id: parsed.data.boatId } });
  if (!boat) return NextResponse.json({ error: "Boat not found" }, { status: 404 });
  if (boat.status !== "available") {
    return NextResponse.json({ slots: [], reason: `Boat is ${boat.status}` });
  }

  const [slots, cfg] = await Promise.all([
    getAvailableSlots(parsed.data.boatId, parsed.data.date, parsed.data.duration),
    getSchedulingConfig(),
  ]);
  return NextResponse.json({
    slots,
    operatingHoursStart: cfg.operatingHoursStart,
    operatingHoursEnd: cfg.operatingHoursEnd,
  });
}
