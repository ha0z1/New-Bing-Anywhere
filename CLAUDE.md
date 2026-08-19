# AA-WWW (tmux.online)

The AI Anywhere site. Astro, static, deployed on Cloudflare Workers static assets. The site itself
has no backend; accounts and device authorisation live at `api.tmux.online` (repo at `../AA-Server`).

## Red lines

- **No `Claude` / `AI` generation markers in commit messages.** No `Co-Authored-By: Claude*`, no
  `Generated with Claude Code` footer. A message describes the change and nothing else.
- **Never commit or upload credentials.** API tokens, Cloudflare/GitHub cookies, `.env`, the OAuth
  credentials under `~/.wrangler` — none of it goes in the repo, into the code, or into an
  issue/PR. Deploy credentials live only in the local `wrangler login` state or in GitHub
  repository secrets. `.gitignore` stops the files, not a paste into a source file — read your own
  `git diff` before committing.
- **Printable ASCII everywhere except `src/i18n/`.** Code, comments, docs, config. Translations are
  data in the copy tables, never prose scattered through the tree. Enforced by
  `scripts/check-ascii.mjs` as an allowlist: printable ASCII plus a short list of typographic and
  box-drawing characters, each entered by hand with a reason. When it rejects something legitimate,
  add that one code point to `ALLOWED`. It runs inside `pnpm lint` and again as a pre-push hook —
  enable the hook once per clone with `git config core.hooksPath .githooks`.
- **`pnpm lint` must pass** before a change counts as done.

## Commands

```bash
pnpm dev / build / preview
pnpm lint       # english check, prettier --check, astro check (run before committing)
pnpm format
pnpm images     # regenerate og.png and the icon sizes
pnpm deploy     # astro build && wrangler deploy
```

Point at a local API: `PUBLIC_API_URL=http://localhost:51994 pnpm dev`.

## Architecture

- **`src/i18n/` is the single source of truth for copy.** English is the baseline, every other
  language is an isomorphic data file. Pages, JSON-LD and `llms.txt` are all derived from it. No
  copy literals in components: adding a language adds data, it does not edit pages.
- **Marketing pages ship zero framework bytes.** Every page is prerendered at build time; the
  client-side logic is a handful of `<script is:inline>` blocks.
- **`/dashboard/*` is the only place that hydrates** — a react-router SPA mounted on a prerendered
  static shell. `/account` and `/device` are static compatibility redirects.
- **`worker/index.js` is the only server-side code**: origin canonicalisation, private delivery of
  the dashboard HTML, and 404 repair. Everything else is Workers static assets plus
  `public/_headers`.

## Conventions (each one is a hole somebody already fell into)

- **No `ClientRouter` / view transitions.** It injects a client-side router into every page, which
  destroys the zero-JS marketing pages. Verify with `grep -c astro-island dist/index.html` (0).
- **Header must never import `src/lib/api.ts`.** It renders on the landing page too, so that import
  would drag React and the island bundle along just to decide the wording of one link. It runs its
  own fetch and parks the promise on `window` for the islands to reuse.
- **Island styles cannot be scoped.** Astro scopes a `<style>` by stamping a data attribute onto
  the elements it emits itself, and React-rendered DOM never gets it. Island styles live in
  `src/styles/*.css` and are imported from the `.tsx`.
- **No trailing slashes in URLs.** The Astro and wrangler settings are a matched pair; canonical,
  hreflang and the sitemap must all use that form.
- **`/dashboard/*`, `/account` and `/device` stay noindex** in four places: the page `<head>`,
  `_headers`, the sitemap filter, and the response headers the Worker sets when it serves dashboard
  HTML. A device-authorisation URL carries a single-use device code.
- **The device-authorisation order is fixed.** `GET /api/auth/device` is the only thing that binds
  a device code to a user, and it only counts when sent with the session cookie. Skip it and
  approve fails with an opaque 400. Read `../AA-Server/docs/frontend-integration.md` first.
- **Single dark theme.** The green is sampled from the tmux wordmark (tmux has no site of its own —
  the logo is the entire brand). The neutrals are deliberately neutral rather than slate blue,
  which would fight the green.
- **Text on green always uses `var(--on-accent)`, never white.** White on that green is 2.62:1,
  which fails outright.
- **The hero headline is not translated** — it is part of the brand. Its `<h1>` carries `lang="en"`
  to keep Latin letter-spacing.
- **CJK typography overrides live in the `:lang()` block at the bottom of `global.css`.** Latin
  negative letter-spacing and tight line-height are a disaster for Han characters, and `ch` is half
  an em in CJK faces. Start there when adding a non-Latin language.
- **The star count is a hardcoded fallback refreshed on the client**, never fetched at build time:
  GitHub's unauthenticated API is 60/hr per IP and a CI runner shares one, while visitors' browsers
  do not. Refresh the committed number by hand once in a while.
- **og.png is generated offline and committed** (`pnpm images`), never built in CI — different
  fonts on a different machine would deform the social card.
- **Analytics default to denied**; consent upgrades them only after the banner is accepted. Do not
  flip the default to make the numbers look better.
- **`public/install.sh` is synced in by the core repo's release pipeline.** Check whether your
  change belongs there instead before editing it here.
- **There is no CSP yet.** Adding one has to account for `api.tmux.online`, the inline scripts
  everywhere, and GA4.

## Code style

prettier: no semicolons, single quotes, two-space indent, printWidth 140, trailingComma all. Do not
work around it with `prettier-ignore`. TypeScript runs `astro/tsconfigs/strict`; `worker/` is plain
JS and is excluded from tsconfig.

## Deploy

Cloudflare Workers static assets (not Pages); `tmux.online` and `www.tmux.online` are both custom
domains. CI deploys only on a version tag (`v1.2.3`) plus manual `workflow_dispatch`. It needs the
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets — **never put them in a file**.
