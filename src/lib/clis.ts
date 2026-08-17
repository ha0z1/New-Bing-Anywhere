/**
 * The CLIs and models this works with, scattered through the hero as their own marks.
 *
 * The artwork is NOT here. Each mark is a file in `public/marks/`, fetched lazily and cached for
 * every later page — inlining fifteen of them cost ~31 KiB of render-blocking HTML on the one
 * document that has to paint fastest, and one of them (Hermes) is an illustration whose path alone
 * is 19 KiB while it draws at 26 pixels. They render as `<img>` so the browser owns the
 * scheduling: off the critical path, decoded asynchronously, at the lowest fetch priority, and far
 * too small to be taken for the LCP element.
 *
 * Colour is baked into each file — the vendor's own where it publishes one, the site's green where
 * the mark is black-on-white and would vanish on this background.
 *
 * `x`/`y` are percentages of the hero, `r` a rotation, `s` a size in px. Hand-placed around the two
 * things that must stay clean — the headline column on the left, the demo mock on the right — and
 * clear of the cookie banner along the bottom. Nothing derives them; if the hero's layout changes
 * they need re-tuning by eye.
 */

export interface CliMark {
  /** file stem in public/marks */
  id: string
  name: string
  x: number
  y: number
  r: number
  s: number
  /** hidden below this viewport width, so the scatter thins out instead of piling up */
  from?: number
  /**
   * Kept in the table but not rendered. The data, the positions and the files all stay, so
   * putting one back is deleting one word rather than re-deriving it.
   */
  off?: true
}

export const CLI_MARKS: CliMark[] = [
  // the agents themselves
  { id: 'claude', name: 'Claude Code', x: 4.5, y: 12, r: -12, s: 30 },
  { id: 'codex', name: 'Codex', x: 27, y: 6, r: 9, s: 24 },
  { id: 'antigravity', name: 'Antigravity', x: 44, y: 15, r: -7, s: 22, from: 1020, off: true },
  { id: 'gemini', name: 'Gemini CLI', x: 39.5, y: 45, r: 6, s: 22, from: 1020, off: true },
  { id: 'opencode', name: 'OpenCode', x: 5, y: 79, r: 11, s: 25 },
  { id: 'copilot', name: 'GitHub Copilot', x: 21, y: 87, r: -8, s: 28, off: true },
  { id: 'openclaw', name: 'OpenClaw', x: 63, y: 8, r: -9, s: 26, from: 1020, off: true },
  { id: 'pi', name: 'Pi', x: 47, y: 84, r: 12, s: 22, from: 1020 },
  // vendor CLIs — same scatter, same rule: a mark only goes here if the vendor ships a
  // terminal agent of its own. Z.ai does not (its play is pointing other agents at its API).
  { id: 'grok', name: 'Grok', x: 73, y: 19, r: 12, s: 21, from: 1020, off: true },
  { id: 'qwen', name: 'Qwen', x: 92, y: 5, r: -6, s: 22, from: 1020, off: true },
  { id: 'kimi', name: 'Kimi', x: 55, y: 3, r: 10, s: 20, from: 1020, off: true },
]
