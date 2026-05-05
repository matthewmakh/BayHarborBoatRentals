import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export const LEAD_COOKIE = "bhbr_lead";
const ONE_YEAR = 60 * 60 * 24 * 365;

// Cuid-shaped random id (lowercase letters + digits, 24 chars). Avoids importing the cuid package.
function newLeadId(): string {
  return "c" + randomBytes(15).toString("base64url").replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 23);
}

export function getLeadId(): string | null {
  return cookies().get(LEAD_COOKIE)?.value ?? null;
}

// Read existing lead id from cookie, or mint a new one. Always sets the cookie.
export function getOrCreateLeadId(): string {
  const jar = cookies();
  const existing = jar.get(LEAD_COOKIE)?.value;
  if (existing) return existing;
  const id = newLeadId();
  jar.set(LEAD_COOKIE, id, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
  return id;
}
