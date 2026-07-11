const KEYWORDS = [
  'contract',
  'function',
  'constructor',
  'fallback',
  'receive',
  'external',
  'public',
  'internal',
  'private',
  'view',
  'pure',
  'payable',
  'returns',
  'return',
  'unchecked',
  'if',
  'else',
  'for',
  'while',
  'new',
  'memory',
  'storage',
  'calldata',
  'override',
  'modifier',
  'event',
  'struct',
  'mapping',
  'delete',
]

const TYPES = [
  'uint256',
  'uint128',
  'uint8',
  'uint',
  'int256',
  'int',
  'bool',
  'address',
  'bytes32',
  'bytes',
  'string',
]

function escapeHtml(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Minimal, dependency-free Solidity syntax highlighter for the handful of
 * static code snippets in the question bank. Not a general-purpose
 * tokenizer — good enough for short, well-formed teaching examples.
 */
export function highlightSolidity(code: string): string {
  let src = escapeHtml(code)
  const stash: string[] = []

  // Letters padding the index on both sides so the later \b\d+\b (number)
  // pass can't accidentally match a digit inside the placeholder itself.
  const place = (html: string) => {
    stash.push(html)
    return `PHx${stash.length - 1}xPH`
  }

  src = src.replace(/"(?:[^"\\]|\\.)*"/g, (m) => place(`<span class="tok-str">${m}</span>`))
  src = src.replace(/\/\/[^\n]*/g, (m) => place(`<span class="tok-com">${m}</span>`))

  src = src.replace(
    new RegExp(`\\b(${KEYWORDS.join('|')})\\b`, 'g'),
    '<span class="tok-kw">$1</span>',
  )
  src = src.replace(
    new RegExp(`\\b(${TYPES.join('|')})\\b`, 'g'),
    '<span class="tok-type">$1</span>',
  )
  src = src.replace(/\b(\d+)\b/g, '<span class="tok-num">$1</span>')

  src = src.replace(/PHx(\d+)xPH/g, (_, i: string) => stash[Number(i)] ?? '')

  return src
}
