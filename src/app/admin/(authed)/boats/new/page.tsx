import Link from "next/link";
import { BoatForm } from "../BoatForm";

export const metadata = { title: "New boat" };

export default function NewBoatPage() {
  return (
    <div className="container-x py-10 max-w-3xl">
      <Link href="/admin/boats" className="text-sm text-navy-600 hover:text-navy-800">← Back</Link>
      <h1 className="mt-2 text-3xl font-serif text-navy-800">New boat</h1>
      <BoatForm />
    </div>
  );
}
