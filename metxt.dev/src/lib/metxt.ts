/**
 * Self-contained me.txt parser and validator.
 * Mirrors the logic from create-me-txt CLI package.
 */

export interface MeTxtLink {
  title: string;
  url: string;
  description?: string;
}

export interface MeTxtSection {
  heading: string;
  content: string[];
  links: MeTxtLink[];
  isOptional: boolean;
}

export interface MeTxt {
  name: string;
  summary: string;
  avatar?: string;
  about?: string;
  sections: MeTxtSection[];
  raw: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: { message: string; rule: string }[];
}

const LINK_RE = /^-\s+\[([^\]]+)\]\(([^)]+)\)(?:\s*[:\u2014\u2013-]\s*(.+))?$/;
const AVATAR_RE = /^!\[([^\]]*)\]\(([^)]+)\)$/;
const STANDARD_SECTIONS = ['Now', 'Skills', 'Stack', 'Work', 'Writing', 'Talks', 'Links', 'Preferences', 'Optional'];

function parseLink(line: string): MeTxtLink | null {
  const match = line.match(LINK_RE);
  if (!match) return null;
  return {
    title: match[1],
    url: match[2],
    ...(match[3] ? { description: match[3].trim() } : {}),
  };
}

export function parse(content: string): MeTxt {
  const lines = content.split('\n');
  let name = '';
  let summary = '';
  let avatar: string | undefined;
  const aboutLines: string[] = [];
  const sections: MeTxtSection[] = [];
  let currentSection: MeTxtSection | null = null;
  let foundFirstH2 = false;
  let foundName = false;
  let foundSummary = false;

  for (const line of lines) {
    if (line.startsWith('# ') && !foundName) {
      name = line.slice(2).trim();
      foundName = true;
      continue;
    }
    if (line.startsWith('> ') && !foundSummary && !foundFirstH2) {
      summary = line.slice(2).trim();
      foundSummary = true;
      continue;
    }
    if (line.startsWith('## ')) {
      foundFirstH2 = true;
      if (currentSection) sections.push(currentSection);
      const heading = line.slice(3).trim();
      currentSection = { heading, content: [], links: [], isOptional: heading.toLowerCase() === 'optional' };
      continue;
    }
    if (!foundFirstH2 && foundName && line.trim()) {
      const avatarMatch = line.match(AVATAR_RE);
      if (avatarMatch && !avatar) { avatar = avatarMatch[2]; continue; }
      aboutLines.push(line);
      continue;
    }
    if (currentSection && line.trim()) {
      currentSection.content.push(line);
      const link = parseLink(line);
      if (link) currentSection.links.push(link);
    }
  }
  if (currentSection) sections.push(currentSection);

  return {
    name,
    summary,
    ...(avatar ? { avatar } : {}),
    ...(aboutLines.length > 0 ? { about: aboutLines.join('\n') } : {}),
    sections,
    raw: content,
  };
}

export function validate(content: string): ValidationResult {
  const parsed = parse(content);
  const errors: { message: string; rule: string }[] = [];

  if (!parsed.name) errors.push({ message: 'Missing name (H1 heading)', rule: 'MISSING_NAME' });
  if (!parsed.summary) errors.push({ message: 'Missing summary (blockquote after H1)', rule: 'MISSING_SUMMARY' });
  if (parsed.sections.length === 0) errors.push({ message: 'No sections found', rule: 'MISSING_SECTION' });

  return { valid: errors.length === 0, errors };
}

export function extractSkills(parsed: MeTxt): string[] {
  const skills = parsed.sections.find(s => s.heading.toLowerCase() === 'skills');
  if (!skills) return [];
  return skills.content
    .map(line => line.replace(/^-\s*/, '').trim())
    .filter(Boolean);
}

export function getSection(parsed: MeTxt, heading: string): MeTxtSection | undefined {
  return parsed.sections.find(s => s.heading.toLowerCase() === heading.toLowerCase());
}
