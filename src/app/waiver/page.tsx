import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rental Waiver" };

export default async function WaiverInfoPage() {
  const active = await prisma.waiverVersion.findFirst({
    where: { isActive: true },
    orderBy: { version: "desc" },
  });

  return (
    <PublicShell>
      <section className="container-x py-12 max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-navy-600">Rental Waiver</p>
        <h1 className="mt-2 text-4xl font-serif text-navy-800">Universal Liability Waiver</h1>
        <p className="mt-3 text-navy-700">
          All renters complete the same universal waiver during checkout. You will be asked to confirm and sign
          your full legal name after submitting a booking — before paying the deposit.
        </p>
        {active ? (
          <article className="mt-8 card p-6 whitespace-pre-line text-navy-800 leading-relaxed">
            {active.body}
          </article>
        ) : (
          <p className="mt-8 text-navy-600">No active waiver published.</p>
        )}
        <div className="mt-6">
          <Link href="/boats" className="btn-primary">Reserve a boat</Link>
        </div>
      </section>
    </PublicShell>
  );
}
