import { createClient, type Client } from '@libsql/client';

let client: Client | null = null;

export function getDb(): Client {
  if (!client) {
    client = createClient({
      url: import.meta.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: import.meta.env.TURSO_AUTH_TOKEN || undefined,
    });
  }
  return client;
}

export async function initSchema() {
  const db = getDb();
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT UNIQUE NOT NULL,
      url TEXT NOT NULL,
      name TEXT NOT NULL,
      summary TEXT,
      avatar TEXT,
      skills TEXT,
      raw_markdown TEXT NOT NULL,
      parsed_json TEXT NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_crawled_at DATETIME,
      last_updated_at DATETIME,
      crawl_failures INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);
    CREATE INDEX IF NOT EXISTS idx_profiles_domain ON profiles(domain);
    CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
  `);
}

export interface ProfileRow {
  id: number;
  domain: string;
  url: string;
  name: string;
  summary: string | null;
  avatar: string | null;
  skills: string | null;
  raw_markdown: string;
  parsed_json: string;
  submitted_at: string;
  last_crawled_at: string | null;
  last_updated_at: string | null;
  crawl_failures: number;
  is_active: number;
}

export interface InsertProfileData {
  domain: string;
  url: string;
  name: string;
  summary?: string;
  avatar?: string;
  skills: string[];
  rawMarkdown: string;
  parsedJson: object;
}

export async function insertProfile(data: InsertProfileData) {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO profiles (domain, url, name, summary, avatar, skills, raw_markdown, parsed_json, last_updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(domain) DO UPDATE SET
            url = excluded.url,
            name = excluded.name,
            summary = excluded.summary,
            avatar = excluded.avatar,
            skills = excluded.skills,
            raw_markdown = excluded.raw_markdown,
            parsed_json = excluded.parsed_json,
            last_updated_at = CURRENT_TIMESTAMP,
            crawl_failures = 0,
            is_active = 1`,
    args: [
      data.domain,
      data.url,
      data.name,
      data.summary || null,
      data.avatar || null,
      JSON.stringify(data.skills),
      data.rawMarkdown,
      JSON.stringify(data.parsedJson),
    ],
  });
}

export async function getProfile(domain: string): Promise<ProfileRow | null> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM profiles WHERE domain = ? AND is_active = 1',
    args: [domain],
  });
  return (result.rows[0] as unknown as ProfileRow) || null;
}

interface ListOptions {
  query?: string;
  sort?: 'newest' | 'updated' | 'alpha';
  page?: number;
  perPage?: number;
}

export async function listProfiles(options: ListOptions = {}) {
  const db = getDb();
  const { query, sort = 'newest', page = 1, perPage = 20 } = options;
  const offset = (page - 1) * perPage;

  let where = 'WHERE is_active = 1';
  const args: (string | number)[] = [];

  if (query) {
    where += ' AND (name LIKE ? OR skills LIKE ? OR summary LIKE ?)';
    const q = `%${query}%`;
    args.push(q, q, q);
  }

  const orderBy =
    sort === 'alpha' ? 'name ASC' :
    sort === 'updated' ? 'last_updated_at DESC' :
    'submitted_at DESC';

  const countResult = await db.execute({ sql: `SELECT COUNT(*) as count FROM profiles ${where}`, args });
  const total = Number(countResult.rows[0]?.count ?? 0);

  args.push(perPage, offset);
  const result = await db.execute({
    sql: `SELECT * FROM profiles ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    args,
  });

  return {
    profiles: result.rows as unknown as ProfileRow[],
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getStats() {
  const db = getDb();
  const countResult = await db.execute('SELECT COUNT(*) as count FROM profiles WHERE is_active = 1');
  const recentResult = await db.execute(
    'SELECT domain, name, summary, avatar, submitted_at FROM profiles WHERE is_active = 1 ORDER BY submitted_at DESC LIMIT 5'
  );
  return {
    total: Number(countResult.rows[0]?.count ?? 0),
    recent: recentResult.rows,
  };
}

export async function getProfilesForCrawl(): Promise<ProfileRow[]> {
  const db = getDb();
  const result = await db.execute('SELECT * FROM profiles WHERE is_active = 1');
  return result.rows as unknown as ProfileRow[];
}

export async function updateCrawlSuccess(domain: string, data: InsertProfileData) {
  const db = getDb();
  await db.execute({
    sql: `UPDATE profiles SET
            name = ?, summary = ?, avatar = ?, skills = ?,
            raw_markdown = ?, parsed_json = ?,
            last_crawled_at = CURRENT_TIMESTAMP,
            last_updated_at = CURRENT_TIMESTAMP,
            crawl_failures = 0
          WHERE domain = ?`,
    args: [
      data.name,
      data.summary || null,
      data.avatar || null,
      JSON.stringify(data.skills),
      data.rawMarkdown,
      JSON.stringify(data.parsedJson),
      domain,
    ],
  });
}

export async function updateCrawlFailure(domain: string) {
  const db = getDb();
  await db.execute({
    sql: `UPDATE profiles SET
            last_crawled_at = CURRENT_TIMESTAMP,
            crawl_failures = crawl_failures + 1,
            is_active = CASE WHEN crawl_failures + 1 >= 3 THEN 0 ELSE 1 END
          WHERE domain = ?`,
    args: [domain],
  });
}
