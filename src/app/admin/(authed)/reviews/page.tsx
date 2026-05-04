import { prisma } from "@/lib/prisma";
import { ReviewsManager } from "./ReviewsManager";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-serif text-navy-800">Reviews</h1>
      <p className="text-navy-600">Manage testimonials shown on the home page.</p>
      <ReviewsManager
        initial={reviews.map((r) => ({
          id: r.id,
          authorName: r.authorName,
          rating: r.rating,
          body: r.body,
          published: r.published,
          sortOrder: r.sortOrder,
        }))}
      />
    </div>
  );
}
