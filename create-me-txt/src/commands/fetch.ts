import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pc from 'picocolors'
import type { FetchOptions } from '../types.js'
import { parse } from '../lib/parser.js'
import { validate } from '../lib/validator.js'

function buildUrls(urlOrDomain: string): string[] {
  let base = urlOrDomain
  if (!base.startsWith('http://') && !base.startsWith('https://')) {
    base = `https://${base}`
  }

  if (base.endsWith('/me.txt') || base.endsWith('/.well-known/me.txt')) {
    return [base]
  }

  base = base.replace(/\/$/, '')
  return [
    `${base}/me.txt`,
    `${base}/.well-known/me.txt`
  ]
}

export { buildUrls }

async function tryFetch(url: string): Promise<{ content: string; resolvedUrl: string } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'create-me-txt',
        'Accept': 'text/plain, text/markdown'
      }
    })
    if (response.ok) {
      return { content: await response.text(), resolvedUrl: url }
    }
  } catch {
    // Network error, try next URL
  }
  return null
}

export async function fetchMeTxt(urlOrDomain: string, options: FetchOptions): Promise<void> {
  const urls = buildUrls(urlOrDomain)

  let result: { content: string; resolvedUrl: string } | null = null

  for (const url of urls) {
    console.log(pc.dim(`  Fetching ${url}...`))
    result = await tryFetch(url)
    if (result) break
  }

  // Fallback: try the metxt.dev directory API
  if (!result) {
    let domain = urlOrDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    console.log(pc.dim(`  Trying metxt.dev directory for ${domain}...`))
    try {
      const apiResp = await fetch(`https://metxt.dev/api/lookup?domain=${encodeURIComponent(domain)}`, {
        headers: { 'User-Agent': 'create-me-txt', 'Accept': 'application/json' }
      })
      if (apiResp.ok) {
        const data = await apiResp.json()
        if (data.raw_markdown) {
          result = { content: data.raw_markdown, resolvedUrl: data.url || `https://${domain}/me.txt` }
        }
      }
    } catch {
      // Registry unavailable, continue to error
    }
  }

  if (!result) {
    console.error(pc.red(`\n  No me.txt found for "${urlOrDomain}"`))
    console.error(pc.dim('  Tried:'))
    for (const url of urls) {
      console.error(pc.dim(`    - ${url}`))
    }
    console.error(pc.dim('    - metxt.dev directory'))
    process.exit(1)
  }

  const { content, resolvedUrl } = result
  const parsed = parse(content)
  const validation = validate(content)

  console.log()
  console.log(`  ${pc.green('✓')} Found valid me.txt for ${pc.bold(parsed.name)}`)
  if (parsed.summary) {
    console.log(`  ${pc.dim('→')} ${parsed.summary}`)
  }
  console.log()
  console.log(pc.dim(`  Sections: ${validation.info.sections.join(', ')}`))
  console.log(pc.dim(`  Tokens: ~${validation.info.estimatedTokens}`))

  if (!validation.valid) {
    console.log()
    console.log(pc.yellow('  Warning: This me.txt has validation issues'))
    for (const err of validation.errors) {
      console.log(pc.yellow(`    ✗ ${err.message}`))
    }
  }

  const savePath = options.output || options.save
  if (savePath) {
    const outputPath = resolve(process.cwd(), savePath)
    writeFileSync(outputPath, content)
    console.log()
    console.log(pc.green(`  ✓ Saved to ${outputPath}`))
  } else if (options.print) {
    console.log()
    console.log(pc.dim('  ---'))
    console.log(content)
  } else {
    console.log()
    console.log(pc.dim(`  Use --print to display full contents`))
    console.log(pc.dim(`  Use --save <path> to save locally`))
  }
}
