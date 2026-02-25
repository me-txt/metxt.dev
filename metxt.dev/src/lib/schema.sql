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
