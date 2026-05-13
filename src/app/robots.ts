import type { MetadataRoute } from "next";

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://www.bayharborboatrentals.com").replace(/\/$/, "");
}

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      // Major search engines + AI/LLM training crawlers — explicitly allowed.
      // Letting AI crawlers index us boosts visibility in ChatGPT, Perplexity, etc.
      {
        userAgent: [
          "*",
          "Googlebot",
          "Bingbot",
          "DuckDuckBot",
          "Slurp", // Yahoo
          "Applebot",
          "Twitterbot",
          "facebookexternalhit",
          "LinkedInBot",
          "GPTBot", // OpenAI / ChatGPT
          "ChatGPT-User",
          "OAI-SearchBot",
          "PerplexityBot",
          "ClaudeBot",
          "Claude-Web",
          "Google-Extended", // Bard / Gemini training
          "Amazonbot",
          "Bytespider",
          "CCBot",
        ],
        allow: ["/"],
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/book/payment/",
          "/book/waiver/",
          "/book/success",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
