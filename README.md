# me.txt

An open standard for personal identity files in the AI age. A simple markdown file at your site root that tells AI who you are — self-authored, human-readable, AI-native.

**Website:** [metxt.dev](https://metxt.dev)

## Packages

| Package | Description |
|---|---|
| [`metxt.dev/`](metxt.dev/) | Website, spec, directory, and API |
| [`create-me-txt/`](create-me-txt/) | CLI to generate, validate, and fetch me.txt files |

## Quick start

Generate your me.txt:

```bash
npx create-me-txt
```

Or with GitHub pre-fill:

```bash
npx create-me-txt --github yourusername
```

## The format

Place a `me.txt` file at your site root (`yoursite.com/me.txt`) or at `/.well-known/me.txt`:

```markdown
# Your Name

> One-line summary of who you are

## Now

- What you're currently working on

## Skills

- Your core competencies

## Links

- [GitHub](https://github.com/you)
- [Website](https://example.com)

## Preferences

- Timezone: UTC-5
- Communication: Async-first
```

See the full [spec](https://metxt.dev/spec) for all sections and conventions.

## Development

```bash
# Website (Astro + Vercel + Turso)
cd metxt.dev
pnpm install
pnpm dev

# CLI (TypeScript + Commander)
cd create-me-txt
pnpm install
pnpm dev
```

## License

MIT
