import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse, parseLink } from '../src/lib/parser.js'
import { render } from '../src/lib/renderer.js'

function fixture(name: string): string {
  return readFileSync(resolve(__dirname, 'fixtures', name), 'utf-8')
}

describe('parse', () => {
  it('parses a full me.txt from fixture', () => {
    const content = fixture('valid-full.txt')
    const result = parse(content)

    expect(result.name).toBe('Jamie Chen')
    expect(result.summary).toBe('Full-stack engineer building developer tools')
    expect(result.avatar).toBe('https://jamiechen.dev/avatar.jpg')
    expect(result.sections).toHaveLength(7)
    expect(result.sections.map(s => s.heading)).toEqual([
      'Now', 'Skills', 'Stack', 'Work', 'Writing', 'Links', 'Preferences'
    ])
  })

  it('parses a minimal me.txt', () => {
    const content = fixture('valid-minimal.txt')
    const result = parse(content)

    expect(result.name).toBe('Alex Rivera')
    expect(result.summary).toBe('Frontend developer focused on design systems')
    expect(result.sections).toHaveLength(1)
    expect(result.sections[0].heading).toBe('Skills')
    expect(result.sections[0].content).toHaveLength(3)
  })

  it('handles missing name gracefully', () => {
    const content = fixture('invalid-no-name.txt')
    const result = parse(content)
    expect(result.name).toBe('')
    expect(result.summary).toBe('A developer without a name heading')
  })

  it('handles empty file', () => {
    const result = parse('')
    expect(result.name).toBe('')
    expect(result.summary).toBe('')
    expect(result.sections).toHaveLength(0)
  })

  it('extracts links from link list sections', () => {
    const content = fixture('valid-with-links.txt')
    const result = parse(content)

    const linksSection = result.sections.find(s => s.heading === 'Links')!
    expect(linksSection.links).toHaveLength(5)
    expect(linksSection.links[0]).toEqual({
      title: 'GitHub',
      url: 'https://github.com/morganlee',
      description: 'Open source contributions'
    })
    expect(linksSection.links[4]).toEqual({
      title: 'Email',
      url: 'mailto:hello@morganlee.dev'
    })
  })

  it('marks Optional sections with isOptional flag', () => {
    const content = `# Test User

> Summary

## Skills

- TypeScript

## Optional

Some extra info
`
    const result = parse(content)
    const skills = result.sections.find(s => s.heading === 'Skills')!
    const optional = result.sections.find(s => s.heading === 'Optional')!

    expect(skills.isOptional).toBe(false)
    expect(optional.isOptional).toBe(true)
  })

  it('extracts avatar from markdown image in intro', () => {
    const content = `# Test User

> Summary

![Test User](https://example.com/photo.jpg)

## Skills

- TypeScript
`
    const result = parse(content)
    expect(result.avatar).toBe('https://example.com/photo.jpg')
  })

  it('has no avatar when none present', () => {
    const content = fixture('valid-minimal.txt')
    const result = parse(content)
    expect(result.avatar).toBeUndefined()
  })

  it('captures about text before first H2', () => {
    const content = `# Test User

> Summary

I am a paragraph before any sections.

## Skills

- TypeScript
`
    const result = parse(content)
    expect(result.about).toBe('I am a paragraph before any sections.')
  })
})

describe('parseLink', () => {
  it('parses a link with description using colon', () => {
    const result = parseLink('- [GitHub](https://github.com/user): My projects')
    expect(result).toEqual({
      title: 'GitHub',
      url: 'https://github.com/user',
      description: 'My projects'
    })
  })

  it('parses a link with description using dash', () => {
    const result = parseLink('- [GitHub](https://github.com/user) - My projects')
    expect(result).toEqual({
      title: 'GitHub',
      url: 'https://github.com/user',
      description: 'My projects'
    })
  })

  it('parses a link without description', () => {
    const result = parseLink('- [GitHub](https://github.com/user)')
    expect(result).toEqual({
      title: 'GitHub',
      url: 'https://github.com/user'
    })
  })

  it('returns null for non-link lines', () => {
    expect(parseLink('- Just a plain list item')).toBeNull()
    expect(parseLink('Some random text')).toBeNull()
    expect(parseLink('')).toBeNull()
  })
})

describe('renderer', () => {
  it('renders a valid me.txt', () => {
    const result = render({
      name: 'Jane Doe',
      summary: 'A developer',
      sections: [
        { heading: 'Skills', content: ['- TypeScript', '- React'], links: [], isOptional: false }
      ]
    })

    expect(result).toContain('# Jane Doe')
    expect(result).toContain('> A developer')
    expect(result).toContain('## Skills')
    expect(result).toContain('- TypeScript')
  })

  it('renders avatar when provided', () => {
    const result = render({
      name: 'Jane Doe',
      summary: 'A developer',
      avatar: 'https://example.com/jane.jpg',
      sections: [
        { heading: 'Skills', content: ['- TypeScript'], links: [], isOptional: false }
      ]
    })

    expect(result).toContain('![Jane Doe](https://example.com/jane.jpg)')
    expect(result.indexOf('![Jane Doe]')).toBeGreaterThan(result.indexOf('> A developer'))
    expect(result.indexOf('![Jane Doe]')).toBeLessThan(result.indexOf('## Skills'))
  })

  it('omits avatar when not provided', () => {
    const result = render({
      name: 'Jane Doe',
      summary: 'A developer',
      sections: [
        { heading: 'Skills', content: ['- TypeScript'], links: [], isOptional: false }
      ]
    })

    expect(result).not.toContain('![')
  })

  it('round-trips through parse and render', () => {
    const original = `# Test User

> Test summary

## Now

Working on stuff

## Skills

- Skill 1
- Skill 2
`
    const parsed = parse(original)
    const rendered = render({
      name: parsed.name,
      summary: parsed.summary,
      sections: parsed.sections
    })

    expect(rendered.trim()).toBe(original.trim())
  })
})
