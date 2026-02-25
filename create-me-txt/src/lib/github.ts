import type { GitHubProfile, GitHubRepo } from '../types.js'

interface GitHubUserResponse {
  name: string | null
  bio: string | null
  avatar_url: string | null
  company: string | null
  location: string | null
  blog: string | null
  twitter_username: string | null
}

interface GitHubRepoResponse {
  name: string
  description: string | null
  language: string | null
  stargazers_count: number
  html_url: string
  fork: boolean
}

export async function fetchGitHubProfile(username: string): Promise<GitHubProfile> {
  const userResponse = await fetch(`https://api.github.com/users/${username}`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'create-me-txt'
    }
  })

  if (!userResponse.ok) {
    if (userResponse.status === 404) {
      throw new Error(`GitHub user "${username}" not found`)
    }
    throw new Error(`GitHub API error: ${userResponse.status}`)
  }

  const user: GitHubUserResponse = await userResponse.json()

  const reposResponse = await fetch(
    `https://api.github.com/users/${username}/repos?sort=stars&per_page=10`,
    {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'create-me-txt'
      }
    }
  )

  let repos: GitHubRepo[] = []
  if (reposResponse.ok) {
    const reposData: GitHubRepoResponse[] = await reposResponse.json()
    repos = reposData
      .filter(r => !r.fork)
      .slice(0, 5)
      .map(r => ({
        name: r.name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        url: r.html_url
      }))
  }

  return {
    name: user.name || username,
    bio: user.bio || '',
    avatar: user.avatar_url,
    company: user.company,
    location: user.location,
    blog: user.blog,
    twitter: user.twitter_username,
    repos
  }
}

export function extractLanguages(repos: GitHubRepo[]): string[] {
  const languages = new Set<string>()
  for (const repo of repos) {
    if (repo.language) {
      languages.add(repo.language)
    }
  }
  return Array.from(languages)
}

export function formatRepoAsWork(repo: GitHubRepo): string {
  const desc = repo.description ? ` - ${repo.description}` : ''
  return `- [${repo.name}](${repo.url})${desc}`
}
