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
  "calendly_url",
  "deposit_percent",
  "instant_reservations_enabled",
  "payment_methods_text",
  "licensed_insured_text",
  "hero_headline",
  "hero_subheadline",
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
    await setSetting(k, String(v ?? ""));
  }

  return NextResponse.json({ ok: true, updated: updates.length });
}
