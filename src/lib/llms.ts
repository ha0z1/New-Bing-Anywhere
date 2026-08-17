import { languages, localizePath, shippedLangs, useCopy, type Lang } from '../i18n'
import { guideEntries, useGuides } from '../i18n/guides'
import { API_URL, INSTALL_COMMAND, INSTALL_URL, ISSUES_URL, NPM_URL, REPO_URL, SITE_URL } from '../config'

/**
 * llms.txt and llms-full.txt, generated from the same copy table the page renders from.
 *
 * Written at build time rather than committed as static files: a machine-readable summary
 * that has drifted from the page is worse than none, and a language model quoting stale
 * numbers back at a user is exactly the failure mode these files exist to prevent.
 * Format follows llmstxt.org — H1, a blockquote summary, then link sections.
 */

const abs = (path: string) => (path.startsWith('http') ? path : `${SITE_URL}${path}`)

/** Absolute URL of `path` in a given locale. */
const loc = (path: string, lang: Lang) => `${SITE_URL}${localizePath(path, lang)}`

// The prose scaffolding stays English regardless of locale — these files are read by
// machines, and one predictable structure beats six translated ones. Only the quoted copy
// changes language, and `Language:` says which.
export const llmsIndex = (lang: Lang): string => {
  const c = useCopy(lang)
  const guides = useGuides(lang)
  const others = shippedLangs.filter((l) => l !== lang)
  const guideLinks = guideEntries
    .map(([id, path]) => `- [${guides.pages[id].title}](${loc(path, lang)}): ${guides.pages[id].description}`)
    .join('\n')

  return `# ${c.brand.name} — AI Anywhere

> ${c.hero.lede}

AI Anywhere is a local bridge server plus a browser UI for tmux. Everything runs on the
user's own machines: ${c.brand.name} serves this static site and the install script, plus the
account and device-authorisation service at ${API_URL.replace('https://', '')}. There is no
terminal relay and no telemetry. Every computer must be authorised with \`ai-anywhere login\`
before the local service starts; terminal sessions, prompts and keystrokes stay local.

## Facts

- Language of this file: ${languages[lang]} (${lang})
- Install (macOS, Linux): \`${INSTALL_COMMAND}\`
- Requirements: tmux, Node.js 22.5 or newer
- Server package: \`@ai-anywhere/cli\` (npm), default port 51984, bound to 127.0.0.1
- Interface: the server hosts the web UI at http://127.0.0.1:51984; a Chrome extension adds
  the same workspace as a side panel plus a page element picker
- Model: a task in the left rail maps to a tmux window; additional tmux windows can appear as
  tabs across the top; SSH hosts appear as their own groups in the same rail
- AI coding tools detected and shown as tasks: Claude, Codex, Gemini, Aider, Copilot

## Pages

- [Home](${loc('/', lang)}): what it does, how to install it, and the FAQ
- [install.sh](${abs(INSTALL_URL)}): the shell installer the site advertises
- [Full site text](${loc('/llms-full.txt', lang)}): every section of the site as plain markdown
${guideLinks}

## Other languages

${others.map((l) => `- [${languages[l]} (${l})](${loc('/', l)}): the same page, translated`).join('\n')}

## Source

- [GitHub](${REPO_URL}): server, web UI and Chrome extension
- [npm](${NPM_URL}): the \`@ai-anywhere/cli\` package
- [Issues](${ISSUES_URL}): bug reports and questions
`
}

export const llmsFull = (lang: Lang): string => {
  const c = useCopy(lang)
  const guides = useGuides(lang)
  const s = []

  s.push(`# ${c.brand.name} — ${c.hero.title}`)
  s.push(`> ${c.meta.description}`)
  s.push(`Source: ${loc('/', lang)}\nLanguage: ${languages[lang]} (${lang})`)

  s.push(`## Install`)
  s.push(`Platforms: ${c.hero.installLabel}`)
  s.push('```sh\n' + INSTALL_COMMAND + '\n```')
  s.push(c.hero.requirement)

  s.push(`## ${c.steps.title}`)
  for (const step of c.steps.items) s.push(`### ${step.n}. ${step.title}\n\n${step.body}`)

  s.push(`## ${c.features.title}`)
  for (const item of c.features.items) s.push(`### ${item.title}\n\n${item.body}`)

  s.push(`## ${c.security.title}`)
  s.push(c.security.body)
  s.push(c.security.points.map((p) => `- ${p}`).join('\n'))

  s.push(`## ${c.faq.title}`)
  for (const item of c.faq.items) s.push(`### ${item.q}\n\n${item.a}`)

  for (const [id] of guideEntries) {
    const guide = guides.pages[id]
    s.push(`## ${guide.title}`)
    s.push(guide.summary)
    for (const section of guide.sections) {
      s.push(`### ${section.title}`)
      s.push(section.body.join('\n\n'))
      if (section.bullets) s.push(section.bullets.map((item) => `- ${item}`).join('\n'))
      if (section.command) s.push('```sh\n' + section.command + '\n```')
    }
  }

  s.push(`## ${c.cta.title}`)
  s.push(c.cta.body)

  s.push(`## Links`)
  s.push(c.footer.columns.flatMap((col) => col.links.map((l) => `- ${l.label}: ${abs(l.href)}`)).join('\n'))

  return s.join('\n\n') + '\n'
}
