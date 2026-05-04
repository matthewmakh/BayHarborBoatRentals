import Link from "next/link";
import type { Boat, BoatPhoto } from "@prisma/client";
import { formatUSD } from "@/lib/pricing";

type Props = {
  boat: Boat & { photos: BoatPhoto[] };
};

const STATUS_LABELS: Record<Boat["status"], string> = {
  available: "Available",
  unavailable: "Unavailable",
  maintenance: "In maintenance",
};

const STATUS_STYLES: Record<Boat["status"], string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  unavailable: "bg-rose-50 text-rose-700 border-rose-200",
  maintenance: "bg-amber-50 text-amber-700 border-amber-200",
};

export function BoatCard({ boat }: Props) {
  const cover = boat.photos[0]?.url;
  const isReservable = boat.status === "available";
  return (
    <article className="card flex flex-col">
      <div className="relative aspect-[4/3] bg-navy-50">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={boat.photos[0]?.alt || boat.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-navy-400 text-sm">No photo yet</div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <span className={`badge ${STATUS_STYLES[boat.status]}`}>{STATUS_LABELS[boat.status]}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-xl font-semibold text-navy-800">{boat.name}</h3>
          <span className="text-xs uppercase tracking-wider text-navy-500">{boat.year} · {boat.lengthFeet}ft</span>
        </div>
        <p className="text-sm text-navy-700/80 line-clamp-3">{boat.description}</p>
        <div className="text-xs text-navy-600">Up to {boat.maxCapacity} guests</div>
        <ul className="grid grid-cols-2 gap-2 text-sm text-navy-800">
          <li className="rounded-lg bg-navy-50 px-3 py-2 flex justify-between"><span>2 hr</span><strong>{formatUSD(boat.price2hCents)}</strong></li>
          <li className="rounded-lg bg-navy-50 px-3 py-2 flex justify-between"><span>4 hr</span><strong>{formatUSD(boat.price4hCents)}</strong></li>
          <li className="rounded-lg bg-navy-50 px-3 py-2 flex justify-between"><span>6 hr</span><strong>{formatUSD(boat.price6hCents)}</strong></li>
          <li className="rounded-lg bg-navy-50 px-3 py-2 flex justify-between"><span>8 hr</span><strong>{formatUSD(boat.price8hCents)}</strong></li>
        </ul>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link href={`/boats/${boat.slug}`} className="text-sm font-semibold text-navy-700 hover:text-navy-600">
            View details →
          </Link>
          {isReservable ? (
            <Link href={`/book/${boat.slug}`} className="btn-primary text-sm">Reserve</Link>
          ) : (
            <span className="btn-secondary text-sm pointer-events-none opacity-70">Not available</span>
          )}
        </div>
      </div>
    </article>
  );
}
