import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { LogoutButton } from "../LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminAuthedLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return (
    <div className="min-h-screen bg-navy-50/40 text-navy-900">
      <AdminNav adminEmail={admin.email} />
      <div>{children}</div>
    </div>
  );
}

function AdminNav({ adminEmail }: { adminEmail: string }) {
  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/boats", label: "Boats" },
    { href: "/admin/bookings", label: "Bookings" },
    { href: "/admin/waiver", label: "Waiver" },
    { href: "/admin/reviews", label: "Reviews" },
    { href: "/admin/settings", label: "Settings" },
  ];
  return (
    <header className="border-b border-navy-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3 py-3">
        <Link href="/admin" className="font-serif text-lg text-navy-800">
          Bay Harbor · Admin
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-md px-3 py-1.5 text-navy-700 hover:bg-navy-100">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-navy-500 hidden md:inline">{adminEmail}</span>
          <Link href="/" className="text-navy-600 hover:text-navy-800">View site</Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
