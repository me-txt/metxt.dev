import type { APIRoute } from 'astro';
import { initSchema, listProfiles } from '../../lib/db';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  await initSchema();

  const query = url.searchParams.get('q') || undefined;
  const sort = (url.searchParams.get('sort') || 'newest') as 'newest' | 'updated' | 'alpha';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));

  const result = await listProfiles({ query, sort, page });

  const profiles = result.profiles.map(p => ({
    domain: p.domain,
    name: p.name,
    summary: p.summary,
    avatar: p.avatar,
    skills: JSON.parse(p.skills || '[]'),
    submitted_at: p.submitted_at,
    last_updated_at: p.last_updated_at,
  }));

  return new Response(JSON.stringify({
    profiles,
    total: result.total,
    page: result.page,
    per_page: result.perPage,
    total_pages: result.totalPages,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
    },
  });
};
