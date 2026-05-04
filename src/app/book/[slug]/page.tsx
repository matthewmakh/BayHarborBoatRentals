import { notFound } from "next/navigation";
import { PublicShell } from "@/components/PublicShell";
import { prisma } from "@/lib/prisma";
import { getDepositPercent, getInstantReservationsEnabled, getSetting, SETTING_KEYS } from "@/lib/settings";
import { todayInBusinessTz } from "@/lib/timezone";
import { BookingForm } from "./BookingForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const boat = await prisma.boat.findUnique({ where: { slug: params.slug } });
  return { title: boat ? `Reserve · ${boat.name}` : "Reserve" };
}

export default async function BookPage({ params }: { params: { slug: string } }) {
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

  if (!instant || boat.status !== "available") {
    return (
      <PublicShell>
        <section className="container-x py-12 max-w-2xl">
          <h1 className="text-3xl font-serif text-navy-800">Reserve {boat.name}</h1>
          <div className="mt-6 card p-6">
            <h2 className="text-lg font-semibold text-navy-700">Call to reserve</h2>
            <p className="mt-2 text-navy-700">
              {boat.status !== "available"
                ? `${boat.name} is currently ${boat.status}. Please give us a call so we can find another option for you.`
                : "We're handling reservations by phone. Give us a call and we'll get you on the water."}
            </p>
            <a href={`tel:${tel}`} className="btn-primary mt-4">Call {phone}</a>
          </div>
        </section>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <section className="container-x py-10 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-serif text-navy-800">Reserve {boat.name}</h1>
        <p className="mt-2 text-navy-700">
          Pick a duration, date, and start time, then sign the waiver and pay your {pct}% deposit to lock it in.
        </p>
        <BookingForm
          boat={{
            id: boat.id,
            slug: boat.slug,
            name: boat.name,
            price2hCents: boat.price2hCents,
            price4hCents: boat.price4hCents,
            price6hCents: boat.price6hCents,
            price8hCents: boat.price8hCents,
            photo: boat.photos[0]?.url ?? null,
          }}
          depositPercent={pct}
          todayInTz={todayInBusinessTz()}
        />
      </section>
    </PublicShell>
  );
}
