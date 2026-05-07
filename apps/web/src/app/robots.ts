import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/admin-login", "/api/"] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
