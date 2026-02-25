import { describe, it, expect } from 'vitest'
import { extractLanguages, formatRepoAsWork } from '../src/lib/github.js'
import type { GitHubRepo } from '../src/types.js'

describe('extractLanguages', () => {
  it('extracts unique languages from repos', () => {
    const repos: GitHubRepo[] = [
      { name: 'repo1', description: null, language: 'TypeScript', stars: 10, url: 'https://github.com/test/repo1' },
      { name: 'repo2', description: null, language: 'JavaScript', stars: 5, url: 'https://github.com/test/repo2' },
      { name: 'repo3', description: null, language: 'TypeScript', stars: 3, url: 'https://github.com/test/repo3' },
    ]

    const languages = extractLanguages(repos)

    expect(languages).toContain('TypeScript')
    expect(languages).toContain('JavaScript')
    expect(languages).toHaveLength(2)
  })

  it('handles repos with no language', () => {
    const repos: GitHubRepo[] = [
      { name: 'repo1', description: null, language: null, stars: 10, url: 'https://github.com/test/repo1' },
      { name: 'repo2', description: null, language: 'TypeScript', stars: 5, url: 'https://github.com/test/repo2' },
    ]

    const languages = extractLanguages(repos)

    expect(languages).toEqual(['TypeScript'])
  })

  it('returns empty array for no repos', () => {
    expect(extractLanguages([])).toEqual([])
  })
})

describe('formatRepoAsWork', () => {
  it('formats repo with description', () => {
    const repo: GitHubRepo = {
      name: 'awesome-project',
      description: 'A really cool project',
      language: 'TypeScript',
      stars: 100,
      url: 'https://github.com/user/awesome-project'
    }

    const formatted = formatRepoAsWork(repo)

    expect(formatted).toBe('- [awesome-project](https://github.com/user/awesome-project) - A really cool project')
  })

  it('formats repo without description', () => {
    const repo: GitHubRepo = {
      name: 'simple-repo',
      description: null,
      language: 'JavaScript',
      stars: 5,
      url: 'https://github.com/user/simple-repo'
    }

    const formatted = formatRepoAsWork(repo)

    expect(formatted).toBe('- [simple-repo](https://github.com/user/simple-repo)')
  })
})
