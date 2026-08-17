# tmux.online

The static marketing site for AI Anywhere, served at <https://tmux.online>. Astro, no
framework runtime, **no JavaScript bundle** — the whole thing is HTML, one stylesheet per
page, and a handful of small inline scripts.

The site itself has no backend. The account and device-authorisation service runs at
`api.tmux.online` (its repository is `../AA-Server`) and authorises each computer before the
local service starts.

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # → dist/
pnpm preview    # serve dist/
pnpm lint       # prettier --check . && astro check — must pass before committing
pnpm format     # prettier --write .
pnpm images     # regenerate public/og.png and the raster icons from src/assets
```

## Layout

```
src/i18n/en.ts               every visible string, English
src/i18n/zh-Hant.ts          the same object, 繁體中文
src/i18n/index.ts            locale table, path helpers
src/lib/llms.ts              llms.txt / llms-full.txt, generated from the copy tables
src/lib/api.ts               typed account API client, imported by the islands
src/lib/icons.ts             icon paths, shared by Icon.astro and islands/Icon.tsx
src/components/Home.astro    the landing page, parameterised by locale
src/components/Schema.astro  JSON-LD, also generated from the copy tables
src/components/Dashboard.astro   /dashboard/* — shell and capability sidebar
src/components/RouteRedirect.astro  query-preserving compatibility redirects
src/islands/AccountPanel.tsx     React: session, devices, API keys, membership
src/islands/DevicePanel.tsx      React: device-code approval
src/styles/auth.css              global styles for the islands
src/pages/index.astro        /          → Home lang="en"
src/pages/dashboard/        /dashboard/* → account utilities   (noindex)
src/pages/account.astro      /account   → compatibility redirect
src/pages/device.astro       /device    → query-preserving compatibility redirect
src/pages/zh-Hant/           /zh-Hant   → localized home and dashboard, 繁體中文
public/install.sh            served at https://tmux.online/install.sh
public/_headers              Cloudflare response headers (content-type, caching, robots)
worker/index.js              the only server-side code: 301 www → apex
wrangler.jsonc               Cloudflare Workers static-assets config
```

No component holds literal prose — copy lives in the `src/i18n/*.ts` tables, so a locale is
a data file rather than a rewrite. The JSON-LD and the llms.txt files are derived from those
same tables, which is what stops the page and its machine-readable mirrors from drifting
apart.

## Islands

Every page is prerendered to HTML at build time. React hydrates only the dashboard surfaces
because those depend on a session and, for device approval, on `?user_code=`. The islands are
passed their copy as props, so a page ships one locale, not all of them.

The marketing pages therefore carry **no framework at all**: no `<astro-island>`, no script
tags, just HTML, CSS and three short inline scripts (copy button, header, language cookie).
That is easy to lose by accident, so it is worth re-checking after any change:

```bash
grep -c astro-island dist/index.html          # must be 0
grep -o '_astro/[^"]*\.js' dist/index.html    # must be empty
```

Two consequences worth knowing:

- **Island styles cannot be scoped.** Astro's `<style>` scoping stamps a data attribute onto
  the elements the `.astro` file itself emits, and React renders its own DOM, which never
  gets stamped. Island styles live in `src/styles/auth.css` and are imported from the
  `.tsx`, so they are pulled onto the hydrating pages only.
- **The header must not import `src/lib/api.ts`.** It renders on the landing page, and that
  import would drag the island bundle — and React — onto it to decide one link's label. It
  runs its own `fetch` and parks the promise on `window.__aaSession`, which `getSession()`
  reuses so a dashboard page asks for the session once rather than twice.

## Adding a language

English is the default and is served unprefixed (`/`). Everything else is served under its
own prefix (`/zh-Hant`), matching the locale codes the app itself uses.

1. `src/i18n/<lang>.ts` — export an object typed `Copy` (TypeScript lists anything missing).
2. Register it in `copy` in `src/i18n/index.ts`, and add an Open Graph territory to
   `ogLocales` there.
3. Copy `src/pages/zh-Hant/` — an `index.astro`, a `404.astro` and the two `.txt` endpoints,
   each four lines.
4. If the script is not Latin, check the `:lang()` block at the bottom of
   `src/styles/global.css`. Latin tracking and leading are wrong for Hanzi, and `ch`-based
   measures hold half as many characters, which is what `--measure-scale` compensates for.

The language switcher in the header and footer, the `<link rel="alternate">` tags, the
`og:locale:alternate` tags and the sitemap all read from `copy`, so they light up on their
own. The switcher stays hidden while only one locale is shipped.

The hero slogan is deliberately not translated and carries `lang="en"` so it keeps Latin
typography inside a CJK page.

### The `L` cookie

Every page view writes the locale it is showing to a cookie named `L` — `L=zh-Hant` — on
the registrable domain (`domain=.tmux.online`, `path=/`, one year, `SameSite=Lax`,
`Secure` over https). Anything else under tmux.online can therefore read the visitor's
language straight off the request rather than re-deriving it from the URL or from
`Accept-Language`.

Set from the client (`src/components/LangCookie.astro`), not as a `Set-Cookie` from the
Worker: a response carrying `Set-Cookie` is not edge-cacheable. Off the real domain —
localhost, `astro preview`, a Workers preview URL — the `Domain` attribute is omitted and
the cookie is host-only, because a `Domain` naming a host you are not on is rejected
outright.

The root `/device` compatibility route is the one reader: it sends the device-code flow to
the matching localized dashboard route. Unknown or missing values fall back to English.
Every content and dashboard page still uses its URL as the rendering source of truth.

## The account pages

`/dashboard/devices`, `/dashboard/api-keys`, `/dashboard/membership` and
`/dashboard/device` are the only pages that talk to a server and hydrate. They call
`api.tmux.online` with plain `fetch` from `src/lib/api.ts`. There is
deliberately **no better-auth client library**: those endpoints are ordinary HTTP, and a
typed 130-line module is easier to reason about than a dependency. The contract it
implements is documented in `../AA-Server/docs/frontend-integration.md`.

Dashboard pages are `noindex` in three places — the `noindex` prop on `Base` (which also
drops the JSON-LD and hreflang alternates), an `X-Robots-Tag` in `public/_headers`, and the
sitemap `filter` in `astro.config.mjs`. `/device` remains as a cookie-aware compatibility
redirect to the localized `/dashboard/device` and preserves its one-time code query string.

To point the pages at a local API during development:

```bash
PUBLIC_API_URL=http://localhost:51994 pnpm dev
```

## install.sh

`public/install.sh` installs tmux when needed, verifies Node.js 22.5+, installs the latest
`@ai-anywhere/cli` globally, and then runs `ai-anywhere up` in the foreground. The CLI opens
the device sign-in flow when this computer is not authorised and continues startup after
approval. `_headers` serves the script as `text/plain` with a 5-minute cache.

## Deploying

Cloudflare Workers static assets (not Pages). `wrangler.jsonc` declares `tmux.online` and
`www.tmux.online` as custom domains, so the first successful deploy creates the DNS records
and hostname bindings itself — the zone just has to exist in the account.

`worker/index.js` sits in front of the assets purely to 301 `www` to the apex. A zone-level
Redirect Rule would do the same without running code, but creating one needs zone write
access that the wrangler OAuth token does not carry. Because of it, `run_worker_first` is
on and every request costs a Worker invocation — if the site ever outgrows the free
request allowance, replace the Worker with a Redirect Rule and drop `main`,
`run_worker_first` and `binding` from `wrangler.jsonc`.

Locally:

```bash
npx wrangler login     # one-time, opens a browser
pnpm run deploy        # astro build && wrangler deploy
```

From CI: `.github/workflows/deploy.yml` deploys every push to `main`. It needs two
repository secrets:

| Secret                  | Where it comes from                                                                                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Dashboard → My Profile → API Tokens → Create Token, with **Workers Scripts: Edit**, **Workers Routes: Edit**, **Zone: Read**, **DNS: Edit** on the tmux.online zone, plus **Account Settings: Read** |
| `CLOUDFLARE_ACCOUNT_ID` | Dashboard → Workers & Pages → Account ID                                                                                                                                                             |
