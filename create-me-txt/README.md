# create-me-txt

CLI tool to generate, validate, and fetch [me.txt](https://metxt.org) files. The open standard for personal AI-readable identity.

## Quick Start

```bash
npx create-me-txt
```

**Not a developer?** Tell your AI agent:

> Create a me.txt file for me following the spec at metxt.org/spec. Place it at my site root (/me.txt). Keep it concise.

## Installation

```bash
npm install -g create-me-txt
# or
pnpm add -g create-me-txt
```

This installs two binaries: `create-me-txt` (generator) and `me-txt` (utility commands).

## Usage

### Generate a me.txt

Run the interactive wizard:

```bash
create-me-txt
# or
create-me-txt generate
```

Pre-fill from your GitHub profile:

```bash
create-me-txt generate --github yourusername
```

Include all optional sections (Writing, Talks, Optional):

```bash
create-me-txt generate --full
```

Skip prompts and generate from flags only:

```bash
create-me-txt generate --github yourusername --yes
```

Output as JSON:

```bash
create-me-txt generate --github yourusername --yes --json
```

Specify output path:

```bash
create-me-txt generate -o public/me.txt
```

### Validate a me.txt

```bash
me-txt lint me.txt
```

Example output:

```
  ✓ Valid me.txt (spec v0.1)
  ℹ 6 sections found: Now, Skills, Stack, Links, Preferences
  ℹ Estimated token count: ~340 tokens
```

### Fetch someone's me.txt

```bash
me-txt fetch example.com
```

The fetch command tries these URLs in order:
1. `https://example.com/me.txt`
2. `https://example.com/.well-known/me.txt`
3. `https://metxt.org/api/lookup` (directory fallback)

Print full contents:

```bash
me-txt fetch example.com --print
```

Save to a file:

```bash
me-txt fetch example.com --save their-me.txt
```

## me.txt Format

```markdown
# Your Name

> One-line summary of who you are and what you do.

## Now

What you're currently working on or focused on.

## Skills

- Skill 1
- Skill 2
- Skill 3

## Stack

- Technology 1
- Technology 2

## Work

- [Project Name](url) - Description
- Company Name - Role

## Links

- [GitHub](https://github.com/username): Open source projects
- [Website](https://example.com): Blog and portfolio
- [Twitter](https://twitter.com/username): Tech thoughts

## Preferences

- Timezone: EST / UTC-5
- Contact: Email for serious inquiries
- Response time: 24-48 hours
```

## Programmatic API

```typescript
import { parse } from 'create-me-txt'
```

The package exports the parser, validator, renderer, and token estimator for use in other tools.

## License

MIT
