import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/PublicShell";
import { prisma } from "@/lib/prisma";
import { formatUSD } from "@/lib/pricing";
import { getDepositPercent, getInstantReservationsEnabled, getSetting, SETTING_KEYS } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const boat = await prisma.boat.findUnique({ where: { slug: params.slug } });
  return { title: boat?.name ?? "Boat" };
}

export default async function BoatDetail({ params }: { params: { slug: string } }) {
  const [boat, depositPercent, instant, phone] = await Promise.all([
    prisma.boat.findUnique({
      where: { slug: params.slug },
      include: { photos: { orderBy: { sortOrder: "asc" } } },
    }),
    getDepositPercent(),
    getInstantReservationsEnabled(),
    getSetting(SETTING_KEYS.phone),
  ]);
  if (!boat) notFound();

  const pct = boat.depositPercentOverride ?? depositPercent;
  const tel = phone.replace(/\D/g, "");
  const isAvailable = boat.status === "available";

  const tiers = [
    { label: "2 hours", price: boat.price2hCents },
    { label: "4 hours", price: boat.price4hCents },
    { label: "6 hours", price: boat.price6hCents },
    { label: "8 hours", price: boat.price8hCents },
  ];

  return (
    <PublicShell>
      <section className="container-x py-10">
        <Link href="/boats" className="text-sm text-navy-600 hover:text-navy-700">← All boats</Link>
        <div className="mt-4 grid gap-8 lg:grid-cols-2">
          <Gallery photos={boat.photos} altBase={boat.name} />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-navy-500">{boat.year} · {boat.lengthFeet}ft · up to {boat.maxCapacity}</p>
            <h1 className="mt-2 text-4xl font-serif text-navy-800">{boat.name}</h1>
            <p className="mt-3 text-navy-700/90 leading-relaxed whitespace-pre-line">{boat.description}</p>

            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-navy-600">Hourly rates</h2>
              <ul className="mt-3 grid grid-cols-2 gap-3">
                {tiers.map((t) => (
                  <li key={t.label} className="rounded-xl border border-navy-100 bg-white p-4 shadow-sm">
                    <div className="text-xs uppercase tracking-wider text-navy-500">{t.label}</div>
                    <div className="mt-1 text-2xl font-semibold text-navy-800">{formatUSD(t.price)}</div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-navy-600">
                Reservations require a {pct}% deposit, charged via Stripe after waiver completion.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {isAvailable ? (
                instant ? (
                  <Link href={`/book/${boat.slug}`} className="btn-primary">Reserve Now</Link>
                ) : (
                  <a href={`tel:${tel}`} className="btn-primary">Call to Reserve · {phone}</a>
                )
              ) : (
                <span className="btn-secondary opacity-70 pointer-events-none">Currently {boat.status}</span>
              )}
              <a href={`tel:${tel}`} className="btn-secondary">Call {phone}</a>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

function Gallery({ photos, altBase }: { photos: { id: string; url: string; alt: string | null }[]; altBase: string }) {
  if (photos.length === 0) {
    return <div className="aspect-[4/3] rounded-2xl bg-navy-50 flex items-center justify-center text-navy-400">No photos</div>;
  }
  return (
    <div className="grid gap-3">
      <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-navy-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[0].url} alt={photos[0].alt || altBase} className="h-full w-full object-cover" />
      </div>
      {photos.length > 1 && (
        <div className="grid grid-cols-3 gap-3">
          {photos.slice(1, 4).map((p) => (
            <div key={p.id} className="aspect-[4/3] overflow-hidden rounded-xl bg-navy-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.alt || altBase} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
