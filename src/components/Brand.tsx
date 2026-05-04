import Link from "next/link";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-baseline gap-1 font-serif tracking-tight">
      <span className={`text-2xl sm:text-3xl font-semibold ${light ? "text-white" : "text-navy-700"}`}>
        Bay Harbor
      </span>
      <span className={`text-sm uppercase tracking-[0.2em] ${light ? "text-white/80" : "text-navy-600"}`}>
        Boat Rentals
      </span>
    </Link>
  );
}
