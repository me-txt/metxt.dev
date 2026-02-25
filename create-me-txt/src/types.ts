export interface MeTxtLink {
  title: string
  url: string
  description?: string
}

export interface MeTxtSection {
  heading: string
  content: string[]
  links: MeTxtLink[]
  isOptional: boolean
}

export interface MeTxt {
  name: string
  summary: string
  avatar?: string
  about?: string
  sections: MeTxtSection[]
  raw: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  info: {
    sectionCount: number
    sections: string[]
    estimatedTokens: number
    lineCount: number
  }
}

export interface ValidationIssue {
  line?: number
  message: string
  rule: string
}

export interface GitHubProfile {
  name: string
  bio: string
  avatar: string | null
  company: string | null
  location: string | null
  blog: string | null
  twitter: string | null
  repos: GitHubRepo[]
}

export interface GitHubRepo {
  name: string
  description: string | null
  language: string | null
  stars: number
  url: string
}

export interface GenerateOptions {
  github?: string
  output?: string
  json?: boolean
  yes?: boolean
  full?: boolean
}

export interface FetchOptions {
  output?: string
  save?: string
  print?: boolean
}

export const STANDARD_SECTIONS = [
  'Now',
  'Skills',
  'Stack',
  'Work',
  'Writing',
  'Talks',
  'Links',
  'Preferences',
  'Optional'
] as const

export type StandardSection = typeof STANDARD_SECTIONS[number]

export const SPEC_VERSION = '0.1'
