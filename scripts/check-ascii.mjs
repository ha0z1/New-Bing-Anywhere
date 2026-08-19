import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

/**
 * Fails when a character outside the allowed set reaches the source tree.
 *
 * The baseline is what an English keyboard types: printable ASCII, plus tab and the line endings.
 * Anything else has to be listed below, one character at a time, with a reason. An allowlist is the
 * only shape that works here — a blocklist has to predict what it is keeping out, and it will
 * always be one script, one dingbat or one look-alike space behind.
 *
 * The point is not typography for its own sake. Translations are data in `src/i18n/`, which is what
 * lets a new locale be a file rather than an edit to every component, and that directory is the one
 * place exempt from this check. Prose in another language anywhere else is unreadable to a
 * contributor who does not speak it. The allowlist also catches the invisible failures ASCII cannot
 * have: a non-breaking space that looks like a space and breaks a shell command, a Cyrillic `a` in
 * an identifier.
 *
 * When this fails on something legitimate, add the code point to ALLOWED with a comment saying what
 * needs it. The report prints the code point in the form the list wants.
 *
 * The list holds the characters themselves rather than escapes, because it is meant to be read at a
 * glance. That is self-consistent: an entry permits itself, and deleting one deletes its only use
 * here, so this file always passes its own check.
 */
const ALLOWED = new Set([
  '─', // box drawing light horizontal: the terminal frames in install.sh, Demo and Header
  '—', // em dash: prose in comments and docs
  '…', // horizontal ellipsis: truncation, both in output and in prose
  '·', // middle dot: inline separator in the header and the account panel
  '→', // rightwards arrow: "input -> output" in comments
  '←', // leftwards arrow: annotating a line in an example block
  '✓', // check mark: install.sh progress output
  '−', // minus sign: the byte delta the inline-script minifier logs
  '❯', // heavy right angle quote: the shell prompt glyph in the demo mock
])

/**
 * Paths allowed to carry other languages. Anchored at the repo root and matched against the
 * forward-slash paths git reports, so this behaves the same on every platform.
 */
const TRANSLATIONS = [/^src\/i18n\//]

/**
 * Tracked files only: an untracked scratch file is not something the project ships. A new file is
 * therefore invisible here until it is staged, which is why this runs at push as well as in lint.
 */
const tracked = () =>
  execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
    .split('\0')
    .filter(Boolean)

/** A NUL byte early in the file is the same heuristic git uses to call something binary. */
const isBinary = (buffer) => buffer.subarray(0, 8000).includes(0)

const codePoint = (ch) => `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`

/** Tab and the two line endings are the only control characters a text file needs. */
const isAllowed = (ch) => {
  const c = ch.codePointAt(0)
  if (c === 0x09 || c === 0x0a || c === 0x0d) return true
  if (c >= 0x20 && c <= 0x7e) return true
  return ALLOWED.has(ch)
}

const findings = []
const offenders = new Set()

for (const file of tracked()) {
  if (TRANSLATIONS.some((allowed) => allowed.test(file))) continue

  let buffer
  try {
    buffer = readFileSync(file)
  } catch {
    // Deleted from the working tree but still in the index: nothing to read, nothing to check.
    continue
  }
  if (isBinary(buffer)) continue

  for (const [index, line] of buffer.toString('utf8').split('\n').entries()) {
    const bad = [...line].filter((ch) => !isAllowed(ch))
    if (bad.length === 0) continue
    for (const ch of bad) offenders.add(ch)
    findings.push({ file, line: index + 1, chars: [...new Set(bad)], text: line.trim() })
  }
}

if (findings.length === 0) {
  console.log('ascii-only: clean')
  process.exit(0)
}

const shown = findings.slice(0, 20)
console.error(`Found ${findings.length} line(s) with characters outside the allowed set:\n`)
for (const { file, line, chars, text } of shown) {
  const points = chars.map(codePoint).join(' ')
  console.error(`  ${file}:${line}  [${points}]  ${text.length > 80 ? `${text.slice(0, 80)}…` : text}`)
}
if (findings.length > shown.length) console.error(`  … and ${findings.length - shown.length} more`)

console.error(`\nDistinct: ${[...offenders].map(codePoint).join(' ')}`)
console.error('Another language belongs in src/i18n/. If one of these is legitimate, add it to ALLOWED in')
console.error('scripts/check-ascii.mjs with a comment saying what needs it.')
process.exit(1)
