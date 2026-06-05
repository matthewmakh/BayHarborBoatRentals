import "./globals.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { getAllSettings } from "@/lib/settings";

const GOOGLE_TAG_ID = "G-FWD1GGPW2M";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a2236",
};

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
        {/* Google tag (gtag.js) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-tag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_TAG_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
