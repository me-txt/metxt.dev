import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { validate, getSection } from '../src/lib/validator.js'
import { parse } from '../src/lib/parser.js'

function fixture(name: string): string {
  return readFileSync(resolve(__dirname, 'fixtures', name), 'utf-8')
}

describe('validate', () => {
  it('validates a full valid me.txt', () => {
    const result = validate(fixture('valid-full.txt'))

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.info.sectionCount).toBeGreaterThan(0)
    expect(result.info.sections).toContain('Skills')
    expect(result.info.sections).toContain('Preferences')
    expect(result.info.estimatedTokens).toBeGreaterThan(0)
  })

  it('validates a minimal valid me.txt', () => {
    const result = validate(fixture('valid-minimal.txt'))

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.info.sectionCount).toBe(1)
  })

  it('fails for missing name', () => {
    const result = validate(fixture('invalid-no-name.txt'))

    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.rule === 'MISSING_NAME')).toBe(true)
  })

  it('fails for missing summary', () => {
    const result = validate(fixture('invalid-no-summary.txt'))

    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.rule === 'MISSING_SUMMARY')).toBe(true)
  })

  it('fails for empty file', () => {
    const result = validate(fixture('invalid-empty.txt'))

    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.rule === 'MISSING_NAME')).toBe(true)
    expect(result.errors.some(e => e.rule === 'MISSING_SUMMARY')).toBe(true)
    expect(result.errors.some(e => e.rule === 'MISSING_SECTION')).toBe(true)
  })

  it('warns about non-standard sections', () => {
    const result = validate(fixture('valid-custom-sections.txt'))

    expect(result.valid).toBe(true)
    expect(result.warnings.some(w => w.rule === 'UNKNOWN_SECTION')).toBe(true)
    const unknownWarnings = result.warnings.filter(w => w.rule === 'UNKNOWN_SECTION')
    expect(unknownWarnings.some(w => w.message.includes('Research'))).toBe(true)
    expect(unknownWarnings.some(w => w.message.includes('Education'))).toBe(true)
  })

  it('warns about empty sections', () => {
    const content = `# Test

> Summary

## Skills

## Now

Working on stuff
`
    const result = validate(content)

    expect(result.valid).toBe(true)
    expect(result.warnings.some(w => w.rule === 'EMPTY_SECTION' && w.message.includes('Skills'))).toBe(true)
  })

  it('warns about long summary', () => {
    const longSummary = 'A'.repeat(201)
    const content = `# Test

> ${longSummary}

## Skills

- TypeScript
`
    const result = validate(content)
    expect(result.warnings.some(w => w.rule === 'LONG_SUMMARY')).toBe(true)
  })

  it('warns about files over 500 lines', () => {
    const lines = ['# Test', '', '> Summary', '', '## Skills', '']
    for (let i = 0; i < 500; i++) {
      lines.push(`- Skill ${i}`)
    }
    const result = validate(lines.join('\n'))
    expect(result.warnings.some(w => w.rule === 'FILE_TOO_LONG')).toBe(true)
  })

  it('reports correct section info', () => {
    const result = validate(fixture('valid-full.txt'))

    expect(result.info.sections).toEqual(
      expect.arrayContaining(['Now', 'Skills', 'Stack', 'Links', 'Preferences'])
    )
    expect(result.info.lineCount).toBeGreaterThan(0)
  })
})

describe('getSection', () => {
  it('finds a section by name (case-insensitive)', () => {
    const parsed = parse(fixture('valid-full.txt'))
    const skills = getSection(parsed, 'skills')

    expect(skills).toBeDefined()
    expect(skills!.heading).toBe('Skills')
    expect(skills!.content.length).toBeGreaterThan(0)
  })

  it('returns undefined for non-existent section', () => {
    const parsed = parse(fixture('valid-minimal.txt'))
    expect(getSection(parsed, 'Nonexistent')).toBeUndefined()
  })
})
