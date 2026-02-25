import type { MeTxt, MeTxtSection, MeTxtLink } from '../types.js'

const LINK_RE = /^-\s+\[([^\]]+)\]\(([^)]+)\)(?:\s*[:\u2014\u2013-]\s*(.+))?$/
const AVATAR_RE = /^!\[([^\]]*)\]\(([^)]+)\)$/

export function parseLink(line: string): MeTxtLink | null {
  const match = line.match(LINK_RE)
  if (!match) return null
  return {
    title: match[1],
    url: match[2],
    ...(match[3] ? { description: match[3].trim() } : {})
  }
}

export function parse(content: string): MeTxt {
  const lines = content.split('\n')
  let name = ''
  let summary = ''
  let avatar: string | undefined
  const aboutLines: string[] = []
  const sections: MeTxtSection[] = []
  let currentSection: MeTxtSection | null = null
  let foundFirstH2 = false
  let foundName = false
  let foundSummary = false

  for (const line of lines) {
    if (line.startsWith('# ') && !foundName) {
      name = line.slice(2).trim()
      foundName = true
      continue
    }

    if (line.startsWith('> ') && !foundSummary && !foundFirstH2) {
      summary = line.slice(2).trim()
      foundSummary = true
      continue
    }

    if (line.startsWith('## ')) {
      foundFirstH2 = true
      if (currentSection) {
        sections.push(currentSection)
      }
      const heading = line.slice(3).trim()
      currentSection = {
        heading,
        content: [],
        links: [],
        isOptional: heading.toLowerCase() === 'optional'
      }
      continue
    }

    if (!foundFirstH2 && foundName && line.trim()) {
      const avatarMatch = line.match(AVATAR_RE)
      if (avatarMatch && !avatar) {
        avatar = avatarMatch[2]
        continue
      }
      aboutLines.push(line)
      continue
    }

    if (currentSection && line.trim()) {
      currentSection.content.push(line)
      const link = parseLink(line)
      if (link) {
        currentSection.links.push(link)
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection)
  }

  return {
    name,
    summary,
    ...(avatar ? { avatar } : {}),
    ...(aboutLines.length > 0 ? { about: aboutLines.join('\n') } : {}),
    sections,
    raw: content
  }
}
