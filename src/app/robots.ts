import type { MetadataRoute } from "next";

const SITE = (process.env.SITE_URL || "https://prostyle.agency").replace(/\/$/, "");

/** robots.txt: служебные страницы закрыты, карта сайта — индекс со всеми частями. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/account", "/admin", "/api/", "/cart", "/checkout", "/order/", "/search"] }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
