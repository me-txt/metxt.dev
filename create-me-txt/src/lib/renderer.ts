import type { MeTxt, MeTxtSection } from '../types.js'
import { parseLink } from './parser.js'

export interface RenderOptions {
  name: string
  summary: string
  avatar?: string
  sections: MeTxtSection[]
}

function makeSection(heading: string, content: string[]): MeTxtSection {
  return {
    heading,
    content,
    links: content.map(l => parseLink(l)).filter((l): l is NonNullable<typeof l> => l !== null),
    isOptional: heading.toLowerCase() === 'optional'
  }
}

export { makeSection }

export function render(options: RenderOptions): string {
  const lines: string[] = []

  lines.push(`# ${options.name}`)
  lines.push('')
  lines.push(`> ${options.summary}`)
  lines.push('')

  if (options.avatar) {
    lines.push(`![${options.name}](${options.avatar})`)
    lines.push('')
  }

  for (const section of options.sections) {
    lines.push(`## ${section.heading}`)
    lines.push('')
    for (const line of section.content) {
      lines.push(line)
    }
    lines.push('')
  }

  return lines.join('\n').trim() + '\n'
}

export function renderFromParsed(parsed: MeTxt): string {
  return render({
    name: parsed.name,
    summary: parsed.summary,
    avatar: parsed.avatar,
    sections: parsed.sections
  })
}
