import Link from "next/link";
import { Brand } from "./Brand";
import { getSetting, SETTING_KEYS } from "@/lib/settings";

export async function Header() {
  const phone = await getSetting(SETTING_KEYS.phone);
  return (
    <header className="border-b border-navy-100 bg-white/90 backdrop-blur sticky top-0 z-30">
      <div className="container-x flex items-center justify-between py-4">
        <Brand />
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-navy-800">
          <Link href="/boats" className="hover:text-navy-600">Boats</Link>
          <Link href="/#reviews" className="hover:text-navy-600">Reviews</Link>
          <Link href="/#contact" className="hover:text-navy-600">Contact</Link>
          <Link href="/waiver" className="hover:text-navy-600">Waiver</Link>
        </nav>
        <div className="flex items-center gap-3">
          <a href={`tel:${phone.replace(/\D/g, "")}`} className="hidden sm:inline text-sm font-semibold text-navy-700 hover:text-navy-600">
            {phone}
          </a>
          <Link href="/boats" className="btn-primary text-sm">Reserve</Link>
        </div>
      </div>
    </header>
  );
}
