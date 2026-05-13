import Link from "next/link";
import type { Metadata } from "next";
import { PublicShell } from "@/components/PublicShell";
import { LicensedBadge } from "@/components/LicensedBadge";
import { getAllSettings, SETTING_KEYS } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About",
  description:
    "Bay Harbor Boat Rentals is a family-run boat charter in Bay Harbor Islands, Florida. Licensed, insured, and locally trusted — premium boats, easy reservations, no membership.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const settings = await getAllSettings();
  const phone = settings[SETTING_KEYS.phone];
  const email = settings[SETTING_KEYS.email];
  const address = settings[SETTING_KEYS.address];
  const tel = phone.replace(/\D/g, "");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <PublicShell>
      <section className="relative isolate overflow-hidden bg-navy-900 text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/boat_landing.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/55 via-navy-900/55 to-navy-900/85" aria-hidden="true" />
        <div className="container-x relative py-20 sm:py-28">
          <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/90 backdrop-blur">
            About us
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl font-serif drop-shadow max-w-3xl">
            Locally trusted boat rentals on Biscayne Bay
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/90 drop-shadow">
            Family-run, fully licensed, and built around one idea — make a day on the water as easy as it should be.
          </p>
        </div>
      </section>

      <section className="container-x py-12 sm:py-16 grid gap-10 lg:grid-cols-[1.4fr_1fr] items-start">
        <div className="prose-like text-navy-800 max-w-none">
          <h2 className="text-3xl font-serif text-navy-800">Our story</h2>
          <p className="mt-4 leading-relaxed">
            Bay Harbor Boat Rentals was started by Daniel and his family with a simple goal:
            give people the easiest way to experience Biscayne Bay without owning a boat. We've
            grown up on these waters and know every sandbar, sunset spot, and shoreline restaurant.
            Our fleet is hand-picked for comfort, reliability, and the unmistakable look of South
            Florida luxury.
          </p>

          <h2 className="mt-10 text-3xl font-serif text-navy-800">What makes us different</h2>
          <ul className="mt-4 grid gap-3 text-navy-800">
            <Feature title="Licensed & fully insured">
              Every charter is covered. We carry full liability insurance and meet all U.S. Coast
              Guard and Florida state requirements.
            </Feature>
            <Feature title="Hand-picked fleet">
              No tired rentals. We maintain each vessel ourselves and replace boats before they
              get worn — so the boat you see in our photos is the boat you'll board.
            </Feature>
            <Feature title="Transparent pricing">
              Hourly rates are right on the boat page. A {30}% deposit holds your reservation, the
              balance is due on arrival — no surprise fees, no membership requirements.
            </Feature>
            <Feature title="Local guidance">
              Want a sandbar day, a sunset cruise, or the best spot for dinner by boat? Ask us.
              We're happy to plan the route with you.
            </Feature>
            <Feature title="Easy reservations">
              Pick a boat, pick a time, sign the waiver, pay the deposit — all online, takes about
              three minutes.
            </Feature>
          </ul>

          <h2 className="mt-10 text-3xl font-serif text-navy-800">Where we are</h2>
          <p className="mt-4 leading-relaxed">
            We're based in Bay Harbor Islands, Florida — minutes from Miami Beach, Surfside, Bal
            Harbour, and the Brickell skyline by water. If you're staying anywhere in the Miami
            area, we're a short ride away.
          </p>
          <p className="mt-2">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-navy-700 hover:text-navy-900 underline-offset-4 hover:underline font-medium">
              {address}
            </a>
          </p>

          <h2 className="mt-10 text-3xl font-serif text-navy-800">Get in touch</h2>
          <p className="mt-4 leading-relaxed">
            Have a question, want to book a private event, or curious if a specific boat is right
            for your group? Call or text us — we usually answer right away.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={`tel:${tel}`} className="btn-primary">📞 Call {phone}</a>
            <a href={`mailto:${email}`} className="btn-secondary">✉️ Email us</a>
            <Link href="/boats" className="btn-secondary">Browse boats</Link>
          </div>
        </div>

        <aside className="grid gap-4">
          <div className="card p-6">
            <LicensedBadge text={settings[SETTING_KEYS.licensedInsuredText]} />
            <ul className="mt-4 grid gap-2 text-sm text-navy-700">
              <Quick label="Phone">
                <a href={`tel:${tel}`} className="hover:text-navy-900">{phone}</a>
              </Quick>
              <Quick label="Email">
                <a href={`mailto:${email}`} className="hover:text-navy-900">{email}</a>
              </Quick>
              <Quick label="Address">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-navy-900">
                  {address}
                </a>
              </Quick>
              <Quick label="Service area">Biscayne Bay · Miami · Bay Harbor Islands · Surfside · Bal Harbour</Quick>
            </ul>
          </div>
          <div className="card overflow-hidden">
            <iframe
              title="Map"
              src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
              className="h-64 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </aside>
      </section>
    </PublicShell>
  );
}

function Feature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-xl border border-navy-100 bg-white p-4 shadow-sm">
      <div className="font-semibold text-navy-800">{title}</div>
      <div className="mt-1 text-navy-700 text-sm leading-relaxed">{children}</div>
    </li>
  );
}

function Quick({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="w-24 shrink-0 text-xs uppercase tracking-wide text-navy-500 pt-0.5">{label}</span>
      <span className="text-navy-800">{children}</span>
    </li>
  );
}
