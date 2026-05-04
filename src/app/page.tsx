import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { BoatCard } from "@/components/BoatCard";
import { Reviews } from "@/components/Reviews";
import { ContactSection } from "@/components/ContactSection";
import { LicensedBadge } from "@/components/LicensedBadge";
import { PaymentMethods } from "@/components/PaymentMethods";
import { prisma } from "@/lib/prisma";
import { getAllSettings, SETTING_KEYS } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, featuredBoats, reviews] = await Promise.all([
    getAllSettings(),
    prisma.boat.findMany({
      where: { status: "available" },
      orderBy: { sortOrder: "asc" },
      take: 3,
      include: { photos: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.review.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" }, take: 3 }),
  ]);

  const phone = settings[SETTING_KEYS.phone];
  const tel = phone.replace(/\D/g, "");

  return (
    <PublicShell>
      <Hero
        headline={settings[SETTING_KEYS.heroHeadline]}
        subheadline={settings[SETTING_KEYS.heroSubheadline]}
        phone={phone}
      />

      <section className="container-x py-12">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <LicensedBadge text={settings[SETTING_KEYS.licensedInsuredText]} />
          <span className="badge">USCG-equipped</span>
          <span className="badge">Bay Harbor Islands, FL</span>
        </div>
      </section>

      <section className="container-x py-12">
        <div className="grid gap-10 md:grid-cols-2 items-center">
          <div className="overflow-hidden rounded-3xl shadow-card border border-navy-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/boat_landing.jpg"
              alt="Luxury yacht charter on Biscayne Bay"
              className="h-full w-full object-cover aspect-[4/3]"
            />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-navy-600">The Bay Harbor experience</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-serif text-navy-800">Curated yachts. Effortless days.</h2>
            <p className="mt-4 text-navy-700/90 leading-relaxed">
              From sunrise cruises to sunset celebrations, our hand-picked fleet pairs sleek design with
              first-class comfort. Every charter is captained, fully insured, and ready when you are.
            </p>
            <ul className="mt-5 space-y-2 text-navy-800">
              <li className="flex items-center gap-2"><Dot /> Captained or self-drive options</li>
              <li className="flex items-center gap-2"><Dot /> Complimentary cooler, ice, and Bluetooth audio</li>
              <li className="flex items-center gap-2"><Dot /> Sandbar, snorkel, and sunset itineraries</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/boats" className="btn-primary">Browse the fleet</Link>
              <a href={`tel:${phone.replace(/\D/g, "")}`} className="btn-secondary">Call {phone}</a>
            </div>
          </div>
        </div>
      </section>

      <section className="container-x py-12">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-navy-600">Featured</p>
            <h2 className="mt-1 text-3xl font-serif text-navy-800">Our fleet</h2>
          </div>
          <Link href="/boats" className="text-sm font-semibold text-navy-700 hover:text-navy-600">
            See all boats →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredBoats.length === 0 ? (
            <p className="text-navy-700">No boats listed yet — check back soon.</p>
          ) : (
            featuredBoats.map((b) => <BoatCard key={b.id} boat={b} />)
          )}
        </div>
      </section>

      <Reviews reviews={reviews} />

      <section className="container-x py-12 grid gap-6 md:grid-cols-2">
        <PaymentMethods text={settings[SETTING_KEYS.paymentMethodsText]} />
        <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-card">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-navy-600">Reach us</h3>
          <p className="mt-2 text-navy-800">
            <strong>{settings[SETTING_KEYS.businessName]}</strong>
          </p>
          <p className="text-navy-700">{settings[SETTING_KEYS.address]}</p>
          <a href={`tel:${tel}`} className="mt-3 inline-block text-2xl font-semibold text-navy-700 hover:text-navy-600">
            {phone}
          </a>
          <p className="mt-2 text-navy-600">
            <a href={`mailto:${settings[SETTING_KEYS.email]}`} className="hover:text-navy-700">
              {settings[SETTING_KEYS.email]}
            </a>
          </p>
        </div>
      </section>

      <ContactSection
        phone={phone}
        email={settings[SETTING_KEYS.email]}
        address={settings[SETTING_KEYS.address]}
      />
    </PublicShell>
  );
}

function Hero({ headline, subheadline, phone }: { headline: string; subheadline: string; phone: string }) {
  const tel = phone.replace(/\D/g, "");
  return (
    <section className="relative isolate overflow-hidden bg-navy-900 text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/boat_landing.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900/55 via-navy-900/45 to-navy-900/85" aria-hidden="true" />
      <div className="container-x relative py-28 sm:py-40">
        <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/90 backdrop-blur">
          Bay Harbor Islands · Florida
        </span>
        <h1 className="mt-5 text-4xl sm:text-6xl font-serif leading-tight max-w-3xl drop-shadow">{headline}</h1>
        <p className="mt-4 max-w-xl text-lg text-white/90 drop-shadow">{subheadline}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/boats" className="btn-primary">Reserve a Boat</Link>
          <a href={`tel:${tel}`} className="btn-outline">Call {phone}</a>
        </div>
      </div>
    </section>
  );
}

function Dot() {
  return <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-navy-600" />;
}
