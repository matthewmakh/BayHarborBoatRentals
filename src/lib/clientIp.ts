import type { NextRequest } from "next/server";

export function getClientIp(req: Request | NextRequest): string | undefined {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim();
  return req.headers.get("x-real-ip") || undefined;
}
