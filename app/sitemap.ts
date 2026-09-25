import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://qadra-oil.vercel.app",
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 1,
    },
    {
      url: "https://qadra-oil.vercel.app/station",
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 1,
    },
    {
      url: "https://qadra-oil.vercel.app/admin",
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 0.8,
    },
    {
      url: "https://qadra-oil.vercel.app/admin/overages",
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 0.8,
    },
    {
      url: "https://qadra-oil.vercel.app/admin/payments",
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 0.8,
    },
    {
      url: "https://qadra-oil.vercel.app/admin/reports",
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 0.8,
    },
    {
      url: "https://qadra-oil.vercel.app/admin/quotas",
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 0.8,
    },
    {
      url: "https://qadra-oil.vercel.app/admin/quota-reset",
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 0.8,
    },
  ];
}
