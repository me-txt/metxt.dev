import type { APIRoute } from 'astro';
import { initSchema, getStats } from '../../lib/db';

export const prerender = false;

export const GET: APIRoute = async () => {
  await initSchema();
  const stats = await getStats();

  return new Response(JSON.stringify(stats), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
    },
  });
};
