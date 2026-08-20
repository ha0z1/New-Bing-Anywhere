/**
 * Release notes for @ai-anywhere/cli, newest first.
 *
 * English only, on purpose: release notes describe code, and the code's vocabulary (pane, grant,
 * bracketed paste) does not survive translation well. The page chrome around them still localises.
 *
 * Data, not prose in a component, so adding a release touches exactly one file. Dates are the
 * dates the version's tag was cut in the core repo.
 */

export interface Release {
  version: string
  /** ISO date (YYYY-MM-DD), the day the release tag was cut. */
  date: string
  /** One user-facing line per change; no trailing periods, matching the site's copy style. */
  changes: string[]
}

export const releases: Release[] = [
  {
    version: '0.0.16',
    date: '2026-08-20',
    changes: [
      'Auto retry: when a CLI reports its turn ended in error and its own retries have given up, the server types a retry command into the pane for you - with an attempt budget and growing backoff, and a notice on the pane so you can tell "it retried" from "it hung". Runs on the server, so it works with every browser closed. Toggle, retry text and attempt cap live in Settings',
      'Pi sessions now report failed runs, so auto retry covers them too',
      'An approved phone is now a full client: every window, every capability, same as the desktop. Approving new devices stays on the desktop',
      'Web settings hide the dropped-file path section on browsers that cannot grant a folder',
    ],
  },
  {
    version: '0.0.15',
    date: '2026-08-19',
    changes: [
      'Bracketed paste is restored on attach for every AI CLI, so a multi-line paste stays one message instead of one submit per line',
      'The CLI offers to install an upgrade instead of describing it, and asks at most once a day',
    ],
  },
  {
    version: '0.0.14',
    date: '2026-08-19',
    changes: [
      'Phones grew up: their own entry point, a task drawer, screenshot paste into the message box, and a readable text view of any pane instead of an 80-column picture',
      'A paired device collects windows; the desktop shows which phones are connected and can cut any of them off',
      'Pick which address the QR code points at',
      'Failed turns land on the dashboard\'s "Needs me" list, and a failed turn can stop being true once you deal with it',
      "Smoother scrolling under a finger, tappable controls, and a phone can no longer re-grid the desktop's window",
    ],
  },
  {
    version: '0.0.13',
    date: '2026-08-18',
    changes: ['Dashboard task chips cluster by group, and toasts carry the CLI mark on the title'],
  },
  {
    version: '0.0.12',
    date: '2026-08-18',
    changes: ['The upgrade prompt fires whenever the published version differs, not only when it is newer'],
  },
  {
    version: '0.0.11',
    date: '2026-08-18',
    changes: [
      'First published release of the AI Anywhere bridge: chat with the AI CLIs on your machine (claude, codex, gemini, ...) from a browser side panel or the web dashboard',
      'Hand one tmux window to a phone by QR code, behind --share',
      'Remote hosts over ssh, per-account scratch dirs, and connected hosts marked with the app-wide green check',
      'Published to npm via Trusted Publishing (OIDC), no long-lived token',
    ],
  },
]
