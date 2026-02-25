import type { APIRoute } from 'astro';
import { initSchema, getProfilesForCrawl, updateCrawlSuccess, updateCrawlFailure } from '../../lib/db';
import { parse, validate, extractSkills } from '../../lib/metxt';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('authorization') || '';
  const cronSecret = import.meta.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await initSchema();
  const profiles = await getProfilesForCrawl();

  let updated = 0;
  let failed = 0;
  let deactivated = 0;

  for (const profile of profiles) {
    try {
      const response = await fetch(profile.url, {
        headers: { 'User-Agent': 'metxt-crawler', Accept: 'text/plain, text/markdown' },
      });

      if (!response.ok) {
        await updateCrawlFailure(profile.domain);
        failed++;
        if (profile.crawl_failures + 1 >= 3) deactivated++;
        continue;
      }

      const content = await response.text();
      const validation = validate(content);

      if (!validation.valid) {
        await updateCrawlFailure(profile.domain);
        failed++;
        continue;
      }

      const parsed = parse(content);
      const skills = extractSkills(parsed);

      await updateCrawlSuccess(profile.domain, {
        domain: profile.domain,
        url: profile.url,
        name: parsed.name,
        summary: parsed.summary,
        avatar: parsed.avatar,
        skills,
        rawMarkdown: content,
        parsedJson: parsed,
      });
      updated++;
    } catch {
      await updateCrawlFailure(profile.domain);
      failed++;
      if (profile.crawl_failures + 1 >= 3) deactivated++;
    }
  }

  return new Response(JSON.stringify({
    crawled: profiles.length,
    updated,
    failed,
    deactivated,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
