/** Outbound URLs, kept in one place so every page and machine-readable mirror stays aligned. */
export const SITE_URL = 'https://tmux.online'
export const REPO_URL = 'https://github.com/AI-Anywhere/AI-Anywhere'
export const REPO_SLUG = 'AI-Anywhere/AI-Anywhere'
export const ISSUES_URL = `${REPO_URL}/issues`
export const NPM_URL = 'https://www.npmjs.com/package/@ai-anywhere/cli'
export const INSTALL_URL = '/install.sh'

/**
 * The install one-liners. These are shell, not prose — identical in every locale — so they
 * live here rather than in the i18n copy tables. `curl` is first, which makes it the default
 * tab. Derived from the site URL so the command and the file it fetches can never disagree.
 */
export const INSTALL_COMMANDS = [
  { id: 'curl', command: `curl -fsSL ${SITE_URL}${INSTALL_URL} | sh` },
  { id: 'wget', command: `wget -qO- ${SITE_URL}${INSTALL_URL} | sh` },
] as const

/** The single canonical one-liner for docs and machine-readable mirrors (curl is conventional). */
export const INSTALL_COMMAND = `curl -fsSL ${SITE_URL}${INSTALL_URL} | sh`

/**
 * Star count baked into the header so a number is on screen from first paint — the live
 * value is fetched client-side and replaces this. It is NOT fetched at build time: GitHub's
 * unauthenticated API is 60/hr per IP, and a CI runner shares one IP across every build, so
 * that call is rate-limited far more often than a visitor's own browser ever would be.
 *
 * Refresh occasionally so the committed fallback does not drift too far from reality.
 */
export const GITHUB_STARS_FALLBACK = 2116

/**
 * The account and device-authorisation service. Same registrable domain as the site, which lets a
 * credentialed `fetch` from here carry the session cookie without any SameSite=None
 * gymnastics — see `docs/frontend-integration.md` in the AA-Server repo.
 *
 * Overridable at build time so `pnpm dev` can point at a local API:
 *   PUBLIC_API_URL=http://localhost:51994 pnpm dev
 */
export const API_URL = import.meta.env.PUBLIC_API_URL || 'https://api.tmux.online'

/**
 * Language preference, written to a cookie on the registrable domain so that the root
 * /device compatibility route and sibling services can select the right locale without
 * guessing from Accept-Language. Value is a locale code from `src/i18n`, e.g. `L=zh-Hant`.
 *
 * The domain is hard-coded rather than derived from `location.hostname`: splitting a
 * hostname into "registrable domain + rest" correctly needs the public suffix list, and a
 * naive last-two-labels rule silently produces `.co.uk`-shaped bugs. Hosts that are not
 * under this domain (localhost, `astro preview`, a Workers preview URL) just get a
 * host-only cookie, which is the right behaviour there anyway.
 */
export const LANG_COOKIE = 'L'
export const COOKIE_DOMAIN = 'tmux.online'
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
