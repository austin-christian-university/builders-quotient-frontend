import type { MetadataRoute } from "next";

const BASE_URL = "https://bq.austinchristianu.org";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), priority: 1.0 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), priority: 0.3 },
    {
      url: `${BASE_URL}/biometric-policy`,
      lastModified: new Date(),
      priority: 0.3,
    },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), priority: 0.5 },
  ];
}
