import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword, verifyPassword } from "@/lib/auth";

const Schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { email, password } = parsed.data;

  let user = await prisma.adminUser.findUnique({ where: { email } });

  // Bootstrap: if no admin exists yet but env credentials match, create the first admin.
  if (!user) {
    const envEmail = process.env.ADMIN_EMAIL;
    const envPassword = process.env.ADMIN_PASSWORD;
    const adminCount = await prisma.adminUser.count();
    if (adminCount === 0 && envEmail && envPassword && email === envEmail && password === envPassword) {
      user = await prisma.adminUser.create({
        data: { email, passwordHash: await hashPassword(password), name: "Site Administrator" },
      });
    } else {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
