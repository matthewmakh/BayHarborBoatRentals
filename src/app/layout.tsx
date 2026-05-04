import "./globals.css";
import type { Metadata } from "next";
import { getAllSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getAllSettings().catch(() => ({} as Record<string, string>));
  const name = settings.business_name || "Bay Harbor Boat Rentals";
  return {
    title: { default: name, template: `%s · ${name}` },
    description:
      "Premium licensed and insured boat rentals in Bay Harbor Islands, Florida. Reserve your day on the water.",
    metadataBase: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : undefined,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white text-navy-900 antialiased">
        {children}
      </body>
    </html>
  );
}
