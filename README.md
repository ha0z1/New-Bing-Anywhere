# AI Anywhere 4.x

**Your agents. Any browser. Anywhere.**

AI Anywhere brings the agent CLI sessions running in tmux to a focused browser interface
that works on desktop and mobile. One command starts the local service, and the web UI
collects every task that needs attention without moving terminal state away from the
machine where it is running.

This repository contains the web layer served at [tmux.online](https://tmux.online):

- the public product site;
- the React account dashboard;
- device authorization and membership screens;
- the shell installer;
- Cloudflare Worker and deployment configuration.

The CLI, tmux integration, local server, and browser workspace live in the
[AI Anywhere core repository](https://github.com/AI-Anywhere/core).

## Install

Run the installer on the machine that hosts your tmux sessions:

```bash
curl -fsSL https://tmux.online/install.sh | sh
```

The installer verifies the local prerequisites, installs `@ai-anywhere/cli`, and starts
AI Anywhere. The server listens on `127.0.0.1` by default, so terminal traffic remains on
the local machine.

## What This App Provides

- A product site prerendered with Astro.
- A client-rendered dashboard built with React Router and SWR.
- GitHub account sign-in and account switching.
- Authorized device management and API key management.
- Trial, referral, and permanent membership views.
- Device authorization that returns users to the correct localized dashboard route.
- English, Japanese, Korean, and Traditional Chinese pages.
- Browser-side caching for responsive dashboard navigation.
- Search-engine exclusion and private caching rules for account routes.
- A downloadable installer with a guarded npm publishing workflow in the core repository.

## Architecture

| Area            | Implementation                                                         |
| --------------- | ---------------------------------------------------------------------- |
| Public pages    | Astro, prerendered HTML, inline critical CSS                           |
| Dashboard       | React, React Router, SWR                                               |
| Account API     | `https://api.tmux.online` through the typed client in `src/lib/api.ts` |
| Localization    | Typed copy tables in `src/i18n`                                        |
| Installer       | `public/install.sh`                                                    |
| Edge runtime    | Cloudflare Worker in `worker/index.js`                                 |
| Response policy | `public/_headers` and Worker response headers                          |
| Deployment      | Wrangler and GitHub Actions                                            |

The public pages do not load a framework runtime. React hydrates only dashboard and device
authorization surfaces that require account state.

Dashboard HTML is cached privately in the browser for ten minutes and is explicitly
excluded from Cloudflare edge caching. Account data is fetched in the browser after the
session is resolved, and dashboard routes are excluded from search indexing through HTML,
response headers, `robots.txt`, and sitemap filtering.

## Routes

| Route                    | Purpose                             |
| ------------------------ | ----------------------------------- |
| `/`                      | English product site                |
| `/ja`, `/ko`, `/zh-Hant` | Localized product sites             |
| `/dashboard/devices`     | Authorized devices                  |
| `/dashboard/api-keys`    | API key management                  |
| `/dashboard/membership`  | Trial, referrals, and membership    |
| `/dashboard/device`      | Device authorization                |
| `/device`                | Cookie-aware compatibility redirect |
| `/install.sh`            | Shell installer download            |

Localized dashboard routes use the same language prefixes as the public pages. The `L`
cookie is a non-sensitive, root-domain preference readable by tmux.online services. It records
the active language so compatibility routes can select the correct location; the bare `/` home
follows a saved non-English preference, and unknown values fall back to English.

## Project Structure

```text
src/components/        Astro page sections and shared site chrome
src/islands/           React dashboard and account surfaces
src/i18n/              Typed localized copy
src/layouts/           Shared HTML document layout
src/lib/               API, caching, icons, and content helpers
src/pages/             Public, dashboard, localized, and text routes
src/styles/            Public and dashboard styles
public/                Installer, icons, manifest, robots, and response headers
scripts/               Build-time optimization and asset scripts
worker/                Cloudflare request handling
```

## Local Development

The project uses pnpm.

```bash
pnpm install
pnpm dev
```

The development server runs at `http://localhost:4321`.

To use a local account API:

```bash
PUBLIC_API_URL=http://localhost:51994 pnpm dev
```

Useful commands:

```bash
pnpm build      # Generate the production site in dist/
pnpm preview    # Serve the production output locally
pnpm check      # Run Astro and TypeScript checks
pnpm lint       # Check formatting and Astro types
pnpm format     # Apply repository formatting
pnpm images     # Regenerate raster images from source assets
```

## Localization

English is served without a URL prefix. Japanese, Korean, and Traditional Chinese use
their own path prefixes.

To add a language:

1. Add a typed copy file under `src/i18n`.
2. Register the locale and its Open Graph locale in `src/i18n/index.ts`.
3. Add the matching page directory under `src/pages`.
4. Check typography and text fit on both mobile and desktop layouts.

The language switcher, alternate links, Open Graph metadata, sitemap, and machine-readable
text pages all derive from the same locale registry.

## Deployment

Build and deploy the Cloudflare Worker and static assets with:

```bash
pnpm deploy
```

The GitHub Actions workflow in `.github/workflows/deploy.yml` deploys pushes to `main`. It
expects these repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Secret values belong in GitHub repository settings and must never be committed.

## Repository Boundary

This repository is the canonical source for the tmux.online website. Changes to the CLI,
local service, tmux protocol, or npm package belong in
[AI Anywhere core](https://github.com/AI-Anywhere/core). The website consumes those runtime
artifacts through the public installer and documented HTTP interfaces.
