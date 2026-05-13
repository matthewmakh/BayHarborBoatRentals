import Link from "next/link";
import { Brand } from "./Brand";
import { getAllSettings, SETTING_KEYS } from "@/lib/settings";

export async function Footer() {
  const s = await getAllSettings();
  const phone = s[SETTING_KEYS.phone];
  const email = s[SETTING_KEYS.email];
  const address = s[SETTING_KEYS.address];
  const ig = s[SETTING_KEYS.instagramUrl];
  const fb = s[SETTING_KEYS.facebookUrl];
  const tt = s[SETTING_KEYS.tiktokUrl];
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <footer className="mt-auto bg-navy-900 text-white">
      <div className="container-x py-12 grid gap-8 md:grid-cols-3">
        <div>
          <Brand light />
          <p className="mt-3 text-sm text-white/70 max-w-xs">
            Premium boat rentals in Bay Harbor Islands, Florida. Licensed and insured.
          </p>
        </div>
        <div className="text-sm">
          <h3 className="font-semibold text-white mb-2">Visit us</h3>
          <p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white underline-offset-4 hover:underline"
            >
              {address}
            </a>
          </p>
          <p className="text-white/80 mt-2">
            <a href={`tel:${phone.replace(/\D/g, "")}`} className="hover:text-white underline-offset-4 hover:underline">{phone}</a>
          </p>
          <p className="text-white/80">
            <a href={`mailto:${email}`} className="hover:text-white underline-offset-4 hover:underline">{email}</a>
          </p>
        </div>
        <div className="text-sm">
          <h3 className="font-semibold text-white mb-2">Explore</h3>
          <ul className="space-y-1 text-white/80">
            <li><Link href="/boats" className="hover:text-white">Our Boats</Link></li>
            <li><Link href="/about" className="hover:text-white">About</Link></li>
            <li><Link href="/#reviews" className="hover:text-white">Reviews</Link></li>
            <li><Link href="/waiver" className="hover:text-white">Waiver</Link></li>
            <li><Link href="/#contact" className="hover:text-white">Contact</Link></li>
          </ul>
          {(ig || fb || tt) && (
            <div className="mt-4 flex gap-4 text-white/80">
              {ig && <a href={ig} className="hover:text-white" target="_blank" rel="noopener noreferrer">Instagram</a>}
              {fb && <a href={fb} className="hover:text-white" target="_blank" rel="noopener noreferrer">Facebook</a>}
              {tt && <a href={tt} className="hover:text-white" target="_blank" rel="noopener noreferrer">TikTok</a>}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x py-4 text-xs text-white/60 flex flex-col sm:flex-row gap-2 justify-between">
          <span>© {new Date().getFullYear()} Bay Harbor Boat Rentals. All rights reserved.</span>
          <span>Licensed &amp; insured · Bay Harbor Islands, FL</span>
        </div>
      </div>
    </footer>
  );
}
