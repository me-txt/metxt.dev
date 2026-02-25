import { describe, it, expect } from 'vitest'
import { buildUrls } from '../src/commands/fetch.js'

describe('buildUrls', () => {
  it('builds fallback URLs from a bare domain', () => {
    const urls = buildUrls('example.com')
    expect(urls).toEqual([
      'https://example.com/me.txt',
      'https://example.com/.well-known/me.txt'
    ])
  })

  it('builds fallback URLs from domain with trailing slash', () => {
    const urls = buildUrls('example.com/')
    expect(urls).toEqual([
      'https://example.com/me.txt',
      'https://example.com/.well-known/me.txt'
    ])
  })

  it('builds fallback URLs from https domain', () => {
    const urls = buildUrls('https://example.com')
    expect(urls).toEqual([
      'https://example.com/me.txt',
      'https://example.com/.well-known/me.txt'
    ])
  })

  it('returns single URL when pointing directly to me.txt', () => {
    const urls = buildUrls('https://example.com/me.txt')
    expect(urls).toEqual(['https://example.com/me.txt'])
  })

  it('returns single URL when pointing to .well-known/me.txt', () => {
    const urls = buildUrls('https://example.com/.well-known/me.txt')
    expect(urls).toEqual(['https://example.com/.well-known/me.txt'])
  })

  it('handles http URLs', () => {
    const urls = buildUrls('http://localhost:3000')
    expect(urls).toEqual([
      'http://localhost:3000/me.txt',
      'http://localhost:3000/.well-known/me.txt'
    ])
  })

  it('handles subdomains', () => {
    const urls = buildUrls('blog.example.com')
    expect(urls).toEqual([
      'https://blog.example.com/me.txt',
      'https://blog.example.com/.well-known/me.txt'
    ])
  })
})
