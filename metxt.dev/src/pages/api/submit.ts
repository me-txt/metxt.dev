import type { APIRoute } from 'astro';
import { parse, validate, extractSkills } from '../../lib/metxt';
import { initSchema, insertProfile } from '../../lib/db';

export const prerender = false;

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return '';
  }
}

function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  if (!url.endsWith('/me.txt') && !url.includes('/.well-known/me.txt')) {
    url = url.replace(/\/$/, '') + '/me.txt';
  }
  return url;
}

export const POST: APIRoute = async ({ request, redirect }) => {
  await initSchema();

  let url: string;
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body = await request.json();
    url = body.url;
  } else {
    const formData = await request.formData();
    url = formData.get('url') as string;
  }

  if (!url) {
    return redirect('/submit?error=Please enter a me.txt URL');
  }

  const normalizedUrl = normalizeUrl(url);
  const domain = extractDomain(normalizedUrl);

  if (!domain) {
    return redirect('/submit?error=Invalid URL');
  }

  let content: string;
  try {
    const response = await fetch(normalizedUrl, {
      headers: { 'User-Agent': 'metxt-directory', Accept: 'text/plain, text/markdown' },
    });
    if (!response.ok) {
      return redirect(`/submit?error=Could not fetch me.txt (HTTP ${response.status})`);
    }
    content = await response.text();
  } catch {
    return redirect(`/submit?error=Could not reach ${domain}`);
  }

  const validation = validate(content);
  if (!validation.valid) {
    const msg = validation.errors.map(e => e.message).join(', ');
    return redirect(`/submit?error=Invalid me.txt: ${msg}`);
  }

  const parsed = parse(content);
  const skills = extractSkills(parsed);

  await insertProfile({
    domain,
    url: normalizedUrl,
    name: parsed.name,
    summary: parsed.summary,
    avatar: parsed.avatar,
    skills,
    rawMarkdown: content,
    parsedJson: parsed,
  });

  return redirect(`/submit?success=${domain}`);
};
