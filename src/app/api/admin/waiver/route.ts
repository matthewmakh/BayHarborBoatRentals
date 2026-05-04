import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const Schema = z.object({ body: z.string().min(50) });

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });

  const latest = await prisma.waiverVersion.findFirst({ orderBy: { version: "desc" } });
  const nextVersion = (latest?.version ?? 0) + 1;

  await prisma.$transaction([
    prisma.waiverVersion.updateMany({ where: { isActive: true }, data: { isActive: false } }),
    prisma.waiverVersion.create({
      data: { version: nextVersion, body: parsed.data.body, isActive: true },
    }),
  ]);

  return NextResponse.json({ ok: true, version: nextVersion });
}
