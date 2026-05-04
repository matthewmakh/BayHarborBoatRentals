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
        className="absolute inset-0 bg-cover bg-center opacity-50"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1559638753-49d6a194c0d4?auto=format&fit=crop&w=2000&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900/70 via-navy-900/60 to-navy-900/90" aria-hidden="true" />
      <div className="container-x relative py-24 sm:py-32">
        <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/90">
          Bay Harbor Islands · Florida
        </span>
        <h1 className="mt-5 text-4xl sm:text-6xl font-serif leading-tight max-w-3xl">{headline}</h1>
        <p className="mt-4 max-w-xl text-lg text-white/80">{subheadline}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/boats" className="btn-primary">Reserve a Boat</Link>
          <a href={`tel:${tel}`} className="btn-outline">Call {phone}</a>
        </div>
      </div>
    </section>
  );
}
