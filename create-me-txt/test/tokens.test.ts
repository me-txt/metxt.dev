import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { estimateTokens } from '../src/lib/tokens.js'

function fixture(name: string): string {
  return readFileSync(resolve(__dirname, 'fixtures', name), 'utf-8')
}

describe('estimateTokens', () => {
  it('returns 0 for empty content', () => {
    expect(estimateTokens('')).toBe(0)
    expect(estimateTokens('   ')).toBe(0)
    expect(estimateTokens('\n\n')).toBe(0)
  })

  it('estimates tokens for a simple string', () => {
    const tokens = estimateTokens('Hello world, this is a test string.')
    expect(tokens).toBeGreaterThan(0)
    expect(tokens).toBeLessThan(20)
  })

  it('estimates tokens for a full me.txt within reasonable range', () => {
    const content = fixture('valid-full.txt')
    const tokens = estimateTokens(content)

    // A ~40 line me.txt with short lines should be roughly 200-500 tokens
    expect(tokens).toBeGreaterThan(100)
    expect(tokens).toBeLessThan(600)
  })

  it('estimates tokens for a minimal me.txt', () => {
    const content = fixture('valid-minimal.txt')
    const tokens = estimateTokens(content)

    expect(tokens).toBeGreaterThan(10)
    expect(tokens).toBeLessThan(100)
  })

  it('strips markdown syntax before estimating', () => {
    const withMarkdown = '# Heading\n\n> Quote\n\n- Item 1\n- Item 2'
    const withoutMarkdown = 'Heading\n\nQuote\n\nItem 1\nItem 2'

    const tokensWithMd = estimateTokens(withMarkdown)
    const tokensWithoutMd = estimateTokens(withoutMarkdown)

    // Should be close since markdown syntax gets stripped
    expect(Math.abs(tokensWithMd - tokensWithoutMd)).toBeLessThan(5)
  })
})
