export function parseTitleCandidates(text: string) {
  return text
    .split('\n')
    .map((line) => line.replace(/^[\-\d\.\)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 5)
}