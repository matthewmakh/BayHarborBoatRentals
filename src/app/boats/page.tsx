import { PublicShell } from "@/components/PublicShell";
import { BoatCard } from "@/components/BoatCard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Our Boats" };

export default async function BoatsPage() {
  const boats = await prisma.boat.findMany({
    orderBy: { sortOrder: "asc" },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <PublicShell>
      <section className="bg-navy-900 text-white">
        <div className="container-x py-16">
          <p className="text-sm uppercase tracking-[0.3em] text-white/70">Browse the fleet</p>
          <h1 className="mt-2 text-4xl font-serif">Our Boats</h1>
          <p className="mt-3 max-w-2xl text-white/80">
            Hand-picked vessels for every kind of day on the water. Tap any boat to view photos, hourly rates, and reserve.
          </p>
        </div>
      </section>

      <section className="container-x py-12">
        {boats.length === 0 ? (
          <p className="text-navy-700">No boats listed yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {boats.map((b) => (
              <BoatCard key={b.id} boat={b} />
            ))}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
