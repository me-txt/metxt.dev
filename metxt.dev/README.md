# metxt.org

The website, spec, directory, and API for [me.txt](https://metxt.org). The open standard for personal AI-readable identity files.

## Stack

- **Framework:** [Astro](https://astro.build) with SSR for dynamic pages
- **Styling:** [Tailwind CSS](https://tailwindcss.com) v4
- **Hosting:** [Vercel](https://vercel.com) (free tier)
- **Database:** [Turso](https://turso.tech) (libSQL/SQLite, free tier)

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/spec` | me.txt specification |
| `/blog` | Blog posts |
| `/submit` | Submit your me.txt to the directory |
| `/directory` | Browse profiles with search, sort, pagination |
| `/directory/[domain]` | Individual profile page |

## API

| Endpoint | Method | Description |
|---|---|---|
| `/api/submit` | POST | Submit a me.txt URL for indexing |
| `/api/lookup` | GET | Lookup a profile by domain |
| `/api/directory` | GET | Search and list profiles |
| `/api/stats` | GET | Directory stats (total, recent) |
| `/api/crawl` | POST | Re-fetch all profiles (cron, auth required) |

## Development

```bash
pnpm install
pnpm dev
```

The dev server uses a local SQLite file (`local.db`). No Turso setup needed.

## Environment variables

| Variable | Description | Dev default |
|---|---|---|
| `TURSO_DATABASE_URL` | Database connection URL | `file:local.db` |
| `TURSO_AUTH_TOKEN` | Turso auth token | (empty for local) |
| `CRON_SECRET` | Secret for crawler auth | `dev-secret` |

## Deployment

Deployed to Vercel with the `@astrojs/vercel` adapter. Set environment variables in the Vercel dashboard.

The daily crawler runs via Vercel Cron (configured in `vercel.json`).

## License

MIT
