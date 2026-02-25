import type { MeTxt, MeTxtSection, ValidationResult, ValidationIssue } from '../types.js'
import { STANDARD_SECTIONS } from '../types.js'
import { parse } from './parser.js'
import { estimateTokens } from './tokens.js'

export function validate(content: string): ValidationResult {
  const parsed = parse(content)
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []
  const lines = content.split('\n')

  if (!parsed.name) {
    errors.push({ message: 'Missing name (H1 heading)', rule: 'MISSING_NAME' })
  }

  if (!parsed.summary) {
    errors.push({ message: 'Missing summary (blockquote after H1)', rule: 'MISSING_SUMMARY' })
  }

  if (parsed.sections.length === 0) {
    errors.push({ message: 'No sections found (H2 headings)', rule: 'MISSING_SECTION' })
  }

  if (parsed.summary && parsed.summary.length > 200) {
    warnings.push({ message: 'Summary exceeds 200 characters', rule: 'LONG_SUMMARY' })
  }

  if (lines.length > 500) {
    warnings.push({
      message: `File is ${lines.length} lines (recommended: under 500)`,
      rule: 'FILE_TOO_LONG'
    })
  }

  for (const section of parsed.sections) {
    if (section.content.length === 0) {
      warnings.push({
        message: `Section "${section.heading}" is empty`,
        rule: 'EMPTY_SECTION'
      })
    }

    if (!STANDARD_SECTIONS.includes(section.heading as any)) {
      warnings.push({
        message: `Non-standard section "${section.heading}"`,
        rule: 'UNKNOWN_SECTION'
      })
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('- [')) {
      const linkMatch = line.match(/^-\s+\[([^\]]*)\]\(([^)]*)\)/)
      if (linkMatch && !linkMatch[2]) {
        errors.push({
          line: i + 1,
          message: `Empty URL in link "${linkMatch[1]}"`,
          rule: 'EMPTY_LINK_URL'
        })
      }
    }
  }

  const tokens = estimateTokens(content)

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info: {
      sectionCount: parsed.sections.length,
      sections: parsed.sections.map(s => s.heading),
      estimatedTokens: tokens,
      lineCount: lines.length
    }
  }
}

export function getSection(parsed: MeTxt, heading: string): MeTxtSection | undefined {
  return parsed.sections.find(s => s.heading.toLowerCase() === heading.toLowerCase())
}
