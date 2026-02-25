import * as p from '@clack/prompts'
import pc from 'picocolors'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { GenerateOptions, MeTxtSection } from '../types.js'
import { render } from '../lib/renderer.js'
import { makeSection } from '../lib/renderer.js'
import { parse } from '../lib/parser.js'
import { fetchGitHubProfile, extractLanguages, formatRepoAsWork } from '../lib/github.js'

export async function generate(options: GenerateOptions): Promise<void> {
  p.intro(pc.cyan('create-me-txt'))

  let name = ''
  let summary = ''
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

      name = profile.name
      summary = profile.bio
      if (profile.avatar) prefillAvatar = profile.avatar

      if (profile.repos.length > 0) {
        prefillSkills = extractLanguages(profile.repos)
        prefillWork = profile.repos.map(formatRepoAsWork)
      }

      if (profile.blog) {
        prefillLinks.push(`- [Website](${profile.blog})`)
      }
      prefillLinks.push(`- [GitHub](https://github.com/${options.github})`)
      if (profile.twitter) {
        prefillLinks.push(`- [Twitter](https://twitter.com/${profile.twitter})`)
      }
    } catch (error) {
      spinner.stop(pc.red(`Failed to fetch GitHub profile: ${(error as Error).message}`))
    }
  }

  if (options.yes) {
    if (!name) name = 'Your Name'
    if (!summary) summary = 'A short summary about yourself'

    const sections: MeTxtSection[] = []

    if (prefillSkills.length > 0) {
      sections.push(makeSection('Skills', prefillSkills.map(s => `- ${s}`)))
    }
    if (prefillWork.length > 0) {
      sections.push(makeSection('Work', prefillWork))
    }
    if (prefillLinks.length > 0) {
      sections.push(makeSection('Links', prefillLinks))
    }

    const avatar = prefillAvatar || undefined
    const content = render({ name, summary, avatar, sections })

    if (options.json) {
      const parsed = parse(content)
      console.log(JSON.stringify(parsed, null, 2))
      return
    }

    const outputPath = options.output || 'me.txt'
    const fullPath = resolve(process.cwd(), outputPath)
    writeFileSync(fullPath, content)
    p.outro(pc.green(`✓ Saved to ${fullPath}`))
    return
  }

  const corePrompts = {
    name: () =>
      p.text({
        message: 'What is your name?',
        placeholder: 'Jane Doe',
        initialValue: name,
        validate: (value) => {
          if (!value.trim()) return 'Name is required'
        }
      }),

    summary: () =>
      p.text({
        message: 'Write a one-line summary about yourself.',
        placeholder: 'Full-stack developer building tools for developers.',
        initialValue: summary,
        validate: (value) => {
          if (!value.trim()) return 'Summary is required'
        }
      }),

    avatar: () =>
      p.text({
        message: 'Profile picture URL (optional, press enter to skip)',
        placeholder: 'https://example.com/avatar.jpg',
        initialValue: prefillAvatar
      }),

    now: () =>
      p.text({
        message: 'What are you currently working on? (Now section)',
        placeholder: 'Building a new project, learning Rust, etc.'
      }),

    skills: () =>
      p.text({
        message: 'List your skills (comma-separated)',
        placeholder: 'TypeScript, React, Node.js, PostgreSQL',
        initialValue: prefillSkills.join(', ')
      }),

    stack: () =>
      p.text({
        message: 'What is your preferred tech stack? (comma-separated)',
        placeholder: 'TypeScript, Next.js, Tailwind, Prisma'
      }),

    work: () =>
      p.text({
        message: 'List notable work/projects (one per line, use - prefix)',
        placeholder: '- Project Name - Description',
        initialValue: prefillWork.join('\n')
      }),

    links: () =>
      p.text({
        message: 'Add your links (one per line, use markdown format)',
        placeholder: '- [GitHub](https://github.com/username)',
        initialValue: prefillLinks.join('\n')
      }),

    timezone: () =>
      p.text({
        message: 'What is your timezone?',
        placeholder: 'EST / UTC-5'
      }),

    contactPref: () =>
      p.text({
        message: 'How do you prefer to be contacted?',
        placeholder: 'Email for serious inquiries, DM for quick questions'
      }),

    responseTime: () =>
      p.text({
        message: 'What is your typical response time?',
        placeholder: '24-48 hours'
      })
  }

  const fullPrompts = options.full
    ? {
      ...corePrompts,
      writing: () =>
        p.text({
          message: 'List your writing/publications (one per line, use markdown format)',
          placeholder: '- [Blog Post Title](https://example.com/post)'
        }),

      talks: () =>
        p.text({
          message: 'List your talks/presentations (one per line, use markdown format)',
          placeholder: '- [Talk Title](https://youtube.com/...)'
        }),

      optional: () =>
        p.text({
          message: 'Anything else? Hobbies, personal details, etc.',
          placeholder: 'Coffee enthusiast, dog person, amateur photographer'
        })
    }
    : corePrompts

  const answers = await p.group(fullPrompts, {
    onCancel: () => {
      p.cancel('Operation cancelled.')
      process.exit(0)
    }
  })

  const sections: MeTxtSection[] = []

  if (answers.now) {
    sections.push(makeSection('Now', [answers.now]))
  }
  if (answers.skills) {
    sections.push(makeSection('Skills', answers.skills.split(',').map((s: string) => `- ${s.trim()}`)))
  }
  if (answers.stack) {
    sections.push(makeSection('Stack', answers.stack.split(',').map((s: string) => `- ${s.trim()}`)))
  }
  if (answers.work) {
    sections.push(makeSection('Work', answers.work.split('\n').filter((l: string) => l.trim())))
  }
  if ('writing' in answers && answers.writing) {
    sections.push(makeSection('Writing', (answers.writing as string).split('\n').filter((l: string) => l.trim())))
  }
  if ('talks' in answers && answers.talks) {
    sections.push(makeSection('Talks', (answers.talks as string).split('\n').filter((l: string) => l.trim())))
  }
  if (answers.links) {
    sections.push(makeSection('Links', answers.links.split('\n').filter((l: string) => l.trim())))
  }

  const preferences: string[] = []
  if (answers.timezone) preferences.push(`- Timezone: ${answers.timezone}`)
  if (answers.contactPref) preferences.push(`- Contact: ${answers.contactPref}`)
  if (answers.responseTime) preferences.push(`- Response time: ${answers.responseTime}`)
  if (preferences.length > 0) {
    sections.push(makeSection('Preferences', preferences))
  }

  if ('optional' in answers && answers.optional) {
    sections.push(makeSection('Optional', [(answers.optional as string)]))
  }

  const content = render({
    name: answers.name,
    summary: answers.summary,
    avatar: answers.avatar || undefined,
    sections
  })

  if (options.json) {
    const parsed = parse(content)
    console.log(JSON.stringify(parsed, null, 2))
    return
  }

  p.note(content, 'Preview')

  const outputPath = options.output || 'me.txt'
  const shouldSave = await p.confirm({
    message: `Save to ${outputPath}?`,
    initialValue: true
  })

  if (p.isCancel(shouldSave) || !shouldSave) {
    p.cancel('File not saved.')
    return
  }

  const fullPath = resolve(process.cwd(), outputPath)
  writeFileSync(fullPath, content)

  p.outro(pc.green(`✓ Saved to ${fullPath}`))
}
