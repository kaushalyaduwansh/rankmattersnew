import { MetadataRoute } from 'next';
import { db } from '@/db';
import { recentExams } from '@/db/schema';
import { desc } from 'drizzle-orm';

export const revalidate = 3600; // Rebuild every 1 hour

const BASE_URL = 'https://rankmatters.in';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch latest 500 exams only (SEO safe limit)
  const exams = await db
    .select()
    .from(recentExams)
    .orderBy(desc(recentExams.createdAt))
    .limit(500);

  const now = new Date();

  // Static important pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/ssc-exams`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/banking-exams`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/rrb-railway-exams`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/state-and-others-exams`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Dynamic exam pages
  const examRoutes: MetadataRoute.Sitemap = exams
    .filter(exam => exam.url)
    .map(exam => ({
      url: `${BASE_URL}/${exam.url}`,
      lastModified: exam.createdAt ?? now,
      changeFrequency: 'daily',
      priority: 0.8,
    }));

  return [...staticRoutes, ...examRoutes];
}
