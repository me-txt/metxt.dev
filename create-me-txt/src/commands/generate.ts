import * as p from '@clack/prompts'
import pc from 'picocolors'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { GenerateOptions, MeTxtSection } from '../types.js'
import { render } from '../lib/renderer.js'
import { makeSection } from '../lib/renderer.js'
import { parse } from '../lib/parser.js'
import { fetchGitHubProfile, extractLanguages, formatRepoAsWork } from '../lib/github.js'

function cancelled(): never {
  p.cancel('Operation cancelled.')
  process.exit(0)
}

async function ask(message: string, placeholder?: string, initialValue?: string): Promise<string> {
  const result = await p.text({ message, placeholder, initialValue })
  if (p.isCancel(result)) cancelled()
  return (result as string) || ''
}

async function askList(label: string, placeholder: string, prefill: string[] = []): Promise<string[]> {
  const items = [...prefill]

  if (items.length > 0) {
    p.note(items.join('\n'), `Pre-filled ${label.toLowerCase()}`)
    const keep = await p.confirm({ message: `Keep these ${label.toLowerCase()}?`, initialValue: true })
    if (p.isCancel(keep)) cancelled()
    if (!keep) items.length = 0
  }

  let adding = true
  while (adding) {
    const item = await ask(
      items.length === 0 ? `Add a ${label.toLowerCase()}` : `Add another ${label.toLowerCase()} (enter to finish)`,
      placeholder
    )
    if (!item.trim()) {
      adding = false
    } else {
      items.push(item.trim())
    }
  }

  return items
}

export async function generate(options: GenerateOptions): Promise<void> {
  p.intro(pc.cyan('create-me-txt'))

  let prefillName = ''
  let prefillSummary = ''
  let prefillAvatar = ''
  let prefillSkills: string[] = []
  let prefillWork: string[] = []
  let prefillLinks: string[] = []

  if (options.github) {
    const spinner = p.spinner()
    spinner.start(`Fetching GitHub profile for ${options.github}...`)

    try {
      const profile = await fetchGitHubProfile(options.github)
      spinner.stop('GitHub profile loaded!')

      prefillName = profile.name
      prefillSummary = profile.bio
      if (profile.avatar) prefillAvatar = profile.avatar
      if (profile.repos.length > 0) {
        prefillSkills = extractLanguages(profile.repos)
        prefillWork = profile.repos.map(formatRepoAsWork)
      }
      if (profile.blog) prefillLinks.push(`- [Website](${profile.blog})`)
      prefillLinks.push(`- [GitHub](https://github.com/${options.github})`)
      if (profile.twitter) prefillLinks.push(`- [Twitter](https://twitter.com/${profile.twitter})`)
    } catch (error) {
      spinner.stop(pc.red(`Failed to fetch GitHub profile: ${(error as Error).message}`))
    }
  }

  // Non-interactive mode
  if (options.yes) {
    const name = prefillName || 'Your Name'
    const summary = prefillSummary || 'A short summary about yourself'
    const sections: MeTxtSection[] = []
    if (prefillSkills.length > 0) sections.push(makeSection('Skills', prefillSkills.map(s => `- ${s}`)))
    if (prefillWork.length > 0) sections.push(makeSection('Work', prefillWork))
    if (prefillLinks.length > 0) sections.push(makeSection('Links', prefillLinks))
    const content = render({ name, summary, avatar: prefillAvatar || undefined, sections })
    if (options.json) { console.log(JSON.stringify(parse(content), null, 2)); return }
    const outputPath = options.output || 'me.txt'
    writeFileSync(resolve(process.cwd(), outputPath), content)
    p.outro(pc.green(`✓ Saved to ${resolve(process.cwd(), outputPath)}`))
    return
  }

  // --- Interactive mode ---

  // Basics
  const name = await ask('What is your name?', 'Jane Doe', prefillName)
  if (!name.trim()) { p.cancel('Name is required.'); process.exit(1) }

  const summary = await ask('One-line summary — who are you, what do you do?', 'Product designer building tools for creators', prefillSummary)
  if (!summary.trim()) { p.cancel('Summary is required.'); process.exit(1) }

  const avatar = await ask('Profile picture URL (press enter to skip)', 'https://example.com/photo.jpg', prefillAvatar)

  // Now
  const nowItems = await askList('Now item', 'Learning Rust, Building a side project, etc.')

  // Skills
  const skillsInput = await ask('Your skills (comma-separated)', 'Design, TypeScript, React', prefillSkills.join(', '))

  // Stack
  const stackInput = await ask('Your tech stack (comma-separated, enter to skip)', 'Figma, VS Code, Next.js')

  // Work
  const workItems = await askList('Work item', '- [Project](https://url) — description', prefillWork)

  // Links
  const linkItems = await askList('Link', '- [GitHub](https://github.com/you)', prefillLinks)

  // Preferences
  p.log.step(pc.dim('Preferences — how people should work with you'))
  const timezone = await ask('Timezone (enter to skip)', 'US Eastern (UTC-5)')
  const contact = await ask('Preferred contact method (enter to skip)', 'Email for serious inquiries, DM for quick questions')
  const responseTime = await ask('Typical response time (enter to skip)', '24-48 hours')

  // Full mode extras
  let writingItems: string[] = []
  let talkItems: string[] = []
  let optionalText = ''

  if (options.full) {
    writingItems = await askList('Writing/publication', '- [Blog Post](https://example.com/post)')
    talkItems = await askList('Talk/presentation', '- [Talk Title](https://youtube.com/...)')
    optionalText = await ask('Anything else? Hobbies, interests, etc. (enter to skip)', 'Coffee, gaming, hiking')
  }

  // Build sections
  const sections: MeTxtSection[] = []

  if (nowItems.length > 0) sections.push(makeSection('Now', nowItems.map(i => i.startsWith('- ') ? i : `- ${i}`)))
  if (skillsInput) sections.push(makeSection('Skills', skillsInput.split(',').map(s => `- ${s.trim()}`)))
  if (stackInput) sections.push(makeSection('Stack', stackInput.split(',').map(s => `- ${s.trim()}`)))
  if (workItems.length > 0) sections.push(makeSection('Work', workItems))
  if (writingItems.length > 0) sections.push(makeSection('Writing', writingItems))
  if (talkItems.length > 0) sections.push(makeSection('Talks', talkItems))
  if (linkItems.length > 0) sections.push(makeSection('Links', linkItems))

  const preferences: string[] = []
  if (timezone) preferences.push(`- Timezone: ${timezone}`)
  if (contact) preferences.push(`- Contact: ${contact}`)
  if (responseTime) preferences.push(`- Response time: ${responseTime}`)
  if (preferences.length > 0) sections.push(makeSection('Preferences', preferences))

  if (optionalText) sections.push(makeSection('Optional', [optionalText]))

  const content = render({ name, summary, avatar: avatar || undefined, sections })

  if (options.json) { console.log(JSON.stringify(parse(content), null, 2)); return }

  p.note(content, 'Preview')

  const outputPath = options.output || 'me.txt'
  const shouldSave = await p.confirm({ message: `Save to ${outputPath}?`, initialValue: true })
  if (p.isCancel(shouldSave) || !shouldSave) { p.cancel('File not saved.'); return }

  const fullPath = resolve(process.cwd(), outputPath)
  writeFileSync(fullPath, content)
  p.outro(pc.green(`✓ Saved to ${fullPath}`))
}
