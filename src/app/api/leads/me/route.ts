import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLeadId } from "@/lib/leadCookie";

export async function GET() {
  const id = getLeadId();
  if (!id) return NextResponse.json({ lead: null });
  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { id: true, fullName: true, phone: true, email: true },
  });
  return NextResponse.json({ lead });
}
