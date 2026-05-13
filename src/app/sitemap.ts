import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://www.bayharborboatrentals.com").replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  // Static pages
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/boats`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/waiver`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  // Boat detail pages
  let boatEntries: MetadataRoute.Sitemap = [];
  try {
    const boats = await prisma.boat.findMany({
      where: { status: { in: ["available", "maintenance"] } },
      select: { slug: true, updatedAt: true },
    });
    boatEntries = boats.map((b) => ({
      url: `${base}/boats/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // DB unreachable at build time — sitemap still has static entries
  }

  return [...staticEntries, ...boatEntries];
}
