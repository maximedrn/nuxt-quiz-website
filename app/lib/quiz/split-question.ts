const MARKER = '{{code}}'

/** Splits question prose around the {{code}} placeholder, if present. */
export function splitQuestion(question: string): { before: string; after: string } {
  const idx = question.indexOf(MARKER)
  if (idx === -1) return { before: question, after: '' }
  return {
    before: question.slice(0, idx).trim(),
    after: question.slice(idx + MARKER.length).trim(),
  }
}
