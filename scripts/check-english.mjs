import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

/**
 * Fails when a language other than English reaches the source tree.
 *
 * The copy tables are the one place that holds other languages, and that is the whole point of
 * them: a translation lives in `src/i18n/` as data, so adding a locale never means editing a
 * component. Everything else — code, comments, docs, config — stays English, so that any
 * contributor can read the reasoning behind a decision without a translation round-trip.
 *
 * Detection is deliberately narrow: CJK ideographs, kana, Hangul and the ideographic and
 * full-width punctuation that travels with them. A blanket "non-ASCII" rule would reject `café`,
 * `—` and `©`, which are English typography rather than another language, and a check that cries
 * wolf gets switched off. A language written in Latin script would slip past this — no regex
 * catches that one, it is on review.
 *
 * The ranges are spelled as escapes rather than as literal characters so that this file passes
 * its own check.
 */
const OTHER_SCRIPT = new RegExp(
  [
    '[',
    '\\u3000-\\u303f', // ideographic space, comma, full stop, corner brackets
    '\\u3040-\\u30ff', // hiragana and katakana
    '\\u3130-\\u318f', // Hangul compatibility jamo
    '\\u3400-\\u4dbf', // CJK unified ideographs extension A
    '\\u4e00-\\u9fff', // CJK unified ideographs
    '\\uac00-\\ud7af', // Hangul syllables
    '\\uf900-\\ufaff', // CJK compatibility ideographs
    '\\uff00-\\uffef', // full-width and half-width forms
    ']',
  ].join(''),
)

/**
 * Paths allowed to carry other languages. Anchored at the repo root and matched against the
 * forward-slash paths git reports, so this behaves the same on every platform.
 */
const TRANSLATIONS = [/^src\/i18n\//]

/** Tracked files only: an untracked scratch file is not something the project ships. */
const tracked = () =>
  execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
    .split('\0')
    .filter(Boolean)

/** A NUL byte early in the file is the same heuristic git uses to call something binary. */
const isBinary = (buffer) => buffer.subarray(0, 8000).includes(0)

const findings = []

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
    if (OTHER_SCRIPT.test(line)) findings.push({ file, line: index + 1, text: line.trim() })
  }
}

if (findings.length === 0) {
  console.log('english-only: clean')
  process.exit(0)
}

const shown = findings.slice(0, 20)
console.error(`Found ${findings.length} line(s) written in another language outside src/i18n/:\n`)
for (const { file, line, text } of shown) {
  console.error(`  ${file}:${line}  ${text.length > 96 ? `${text.slice(0, 96)}…` : text}`)
}
if (findings.length > shown.length) console.error(`  … and ${findings.length - shown.length} more`)
console.error('\nTranslations belong in src/i18n/. Code, comments and docs stay English.')
process.exit(1)
