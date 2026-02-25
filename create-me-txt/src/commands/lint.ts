import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pc from 'picocolors'
import { SPEC_VERSION } from '../types.js'
import { validate } from '../lib/validator.js'

export async function lint(filePath: string): Promise<void> {
  const fullPath = resolve(process.cwd(), filePath)

  let content: string
  try {
    content = readFileSync(fullPath, 'utf-8')
  } catch {
    console.error(pc.red(`Error: Could not read file "${filePath}"`))
    process.exit(1)
  }

  const result = validate(content)

  console.log()

  if (result.valid) {
    console.log(pc.green(`  ✓ Valid me.txt (spec v${SPEC_VERSION})`))
  } else {
    console.log(pc.red(`  ✗ Invalid me.txt (spec v${SPEC_VERSION})`))
  }

  if (result.info.sectionCount > 0) {
    console.log(pc.cyan(`  ℹ ${result.info.sectionCount} sections found: ${result.info.sections.join(', ')}`))
  }

  console.log(pc.cyan(`  ℹ Estimated token count: ~${result.info.estimatedTokens} tokens`))

  if (result.errors.length > 0) {
    console.log()
    for (const error of result.errors) {
      const loc = error.line ? ` (line ${error.line})` : ''
      console.log(pc.red(`  ✗ ${error.message}${loc}`))
    }
  }

  if (result.warnings.length > 0) {
    console.log()
    for (const warning of result.warnings) {
      const loc = warning.line ? ` (line ${warning.line})` : ''
      console.log(pc.yellow(`  ⚠ ${warning.message}${loc}`))
    }
  }

  console.log()

  if (!result.valid) {
    process.exit(1)
  }
}
