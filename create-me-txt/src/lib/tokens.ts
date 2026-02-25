/**
 * Lightweight token estimator for me.txt files.
 * Uses ~4 chars per token heuristic with markdown syntax stripping.
 * Accurate within ~10% for typical English me.txt content.
 */
export function estimateTokens(content: string): number {
  if (!content.trim()) return 0

  const stripped = content
    .replace(/^#{1,6}\s/gm, '')
    .replace(/^>\s/gm, '')
    .replace(/^-\s/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n{2,}/g, '\n')

  const words = stripped.split(/\s+/).filter(Boolean)
  const charCount = stripped.replace(/\s+/g, '').length

  // Blend word-based and char-based estimates for better accuracy
  const wordEstimate = Math.ceil(words.length * 1.3)
  const charEstimate = Math.ceil(charCount / 4)

  return Math.round((wordEstimate + charEstimate) / 2)
}
