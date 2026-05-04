import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BoatForm } from "../BoatForm";
import { PhotoManager } from "./PhotoManager";

export const dynamic = "force-dynamic";

export default async function EditBoatPage({ params }: { params: { id: string } }) {
  const boat = await prisma.boat.findUnique({
    where: { id: params.id },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });
  if (!boat) notFound();

  return (
    <div className="container-x py-10 max-w-3xl">
      <Link href="/admin/boats" className="text-sm text-navy-600 hover:text-navy-800">← Back</Link>
      <h1 className="mt-2 text-3xl font-serif text-navy-800">Edit {boat.name}</h1>
      <BoatForm
        initial={{
          id: boat.id,
          slug: boat.slug,
          name: boat.name,
          year: boat.year,
          lengthFeet: boat.lengthFeet,
          maxCapacity: boat.maxCapacity,
          description: boat.description,
          status: boat.status,
          price2hCents: boat.price2hCents,
          price4hCents: boat.price4hCents,
          price6hCents: boat.price6hCents,
          price8hCents: boat.price8hCents,
          depositPercentOverride: boat.depositPercentOverride,
          sortOrder: boat.sortOrder,
        }}
      />

      <h2 className="mt-12 text-2xl font-serif text-navy-800">Photos</h2>
      <p className="text-sm text-navy-600">Paste image URLs from your hosting/CDN. Drag-free reordering with the up/down buttons.</p>
      <PhotoManager
        boatId={boat.id}
        initialPhotos={boat.photos.map((p) => ({ id: p.id, url: p.url, alt: p.alt ?? "" }))}
      />
    </div>
  );
}
