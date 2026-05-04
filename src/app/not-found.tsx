import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";

export default function NotFound() {
  return (
    <PublicShell>
      <section className="container-x py-24 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-navy-600">404</p>
        <h1 className="mt-3 text-4xl font-serif text-navy-800">Page not found</h1>
        <p className="mt-2 text-navy-600">The page you’re looking for has drifted out to sea.</p>
        <div className="mt-6"><Link href="/" className="btn-primary">Back to home</Link></div>
      </section>
    </PublicShell>
  );
}
