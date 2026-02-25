import type { APIRoute } from 'astro';
import { initSchema, getProfile } from '../../lib/db';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  await initSchema();

  const domain = url.searchParams.get('domain');
  if (!domain) {
    return new Response(JSON.stringify({ error: 'Missing domain parameter', code: 'MISSING_PARAM' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const profile = await getProfile(domain);
  if (!profile) {
    return new Response(JSON.stringify({ error: 'Profile not found', code: 'NOT_FOUND' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    domain: profile.domain,
    url: profile.url,
    name: profile.name,
    summary: profile.summary,
    avatar: profile.avatar,
    skills: JSON.parse(profile.skills || '[]'),
    raw_markdown: profile.raw_markdown,
    parsed: JSON.parse(profile.parsed_json),
    submitted_at: profile.submitted_at,
    last_updated_at: profile.last_updated_at,
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
