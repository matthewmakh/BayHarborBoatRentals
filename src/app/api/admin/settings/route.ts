import { NextResponse } from "next/server";
import { setSetting } from "@/lib/settings";

const ALLOWED_KEYS = new Set([
  "business_name",
  "phone",
  "email",
  "address",
  "instagram_url",
  "facebook_url",
  "tiktok_url",
  "deposit_percent",
  "instant_reservations_enabled",
  "payment_methods_text",
  "licensed_insured_text",
  "hero_headline",
  "hero_subheadline",
  "operating_hours_start",
  "operating_hours_end",
  "slot_increment_minutes",
  "buffer_minutes_between_bookings",
]);

export async function PATCH(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updates = Object.entries(body as Record<string, unknown>).filter(([k]) => ALLOWED_KEYS.has(k));
  for (const [k, v] of updates) {
    if (k === "deposit_percent") {
      const n = parseInt(String(v), 10);
      if (Number.isNaN(n) || n < 0 || n > 100) {
        return NextResponse.json({ error: "deposit_percent must be 0-100" }, { status: 400 });
      }
      await setSetting(k, String(n));
      continue;
    }
    if (k === "instant_reservations_enabled") {
      await setSetting(k, v === "true" || v === true ? "true" : "false");
      continue;
    }
    if (k === "operating_hours_start" || k === "operating_hours_end") {
      if (!/^\d{2}:\d{2}$/.test(String(v))) {
        return NextResponse.json({ error: `${k} must be HH:mm` }, { status: 400 });
      }
      await setSetting(k, String(v));
      continue;
    }
    if (k === "slot_increment_minutes" || k === "buffer_minutes_between_bookings") {
      const n = parseInt(String(v), 10);
      if (Number.isNaN(n) || n < 0 || n > 240) {
        return NextResponse.json({ error: `${k} must be 0-240 minutes` }, { status: 400 });
      }
      await setSetting(k, String(n));
      continue;
    }
    await setSetting(k, String(v ?? ""));
  }

  return NextResponse.json({ ok: true, updated: updates.length });
}
