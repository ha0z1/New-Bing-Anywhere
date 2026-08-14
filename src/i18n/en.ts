import { INSTALL_URL, ISSUES_URL, NPM_URL, REPO_URL } from '../config'

// Every visible string on the site lives here. A new locale is a sibling file that
// satisfies `Copy` (see ./index.ts) — no component should ever hold literal prose.
export const en = {
  meta: {
    title: 'tmux.online — your tmux, now in the browser',
    description:
      'Your existing tmux sessions, opened in a browser tab. Local and remote machines in one workspace — and a heads-up the moment an AI CLI needs you.',
    ogAlt: 'tmux.online browser workspace with local and remote tmux sessions',
  },
  brand: {
    name: 'tmux.online',
    tagline: 'by AI Anywhere',
  },
  nav: {
    install: 'Install',
    features: 'Features',
    faq: 'FAQ',
    github: 'GitHub',
    signIn: 'Sign in',
    account: 'Account',
    skipToContent: 'Skip to content',
  },
  hero: {
    eyebrow: 'The command line, as simple as a web page.',
    title: 'Your tmux, now in the browser',
    lede: 'Open the sessions already running — here or over SSH — move between tasks and panes, and step away until one needs you.',
    installLabel: 'macOS and Linux',
    copy: 'Copy',
    copied: 'Copied',
    copyAria: 'Copy the install command',
    scriptLink: 'Read the script first',
    requirement: 'Requires tmux and Node.js 22.5+.',
  },
  demo: {
    caption: 'One workspace across local and remote machines — every task and every pane, in view.',
    tabs: ['tmux.online', 'localhost:16666'],
    url: '127.0.0.1:16666',
    railTitle: 'Machines & tasks',
    groups: [
      {
        name: 'This machine',
        items: [
          { name: 'api-server', detail: 'main · 3 panes', state: 'waiting' },
          { name: 'web', detail: 'feat/i18n', state: 'busy' },
          { name: 'notes', detail: 'main', state: 'idle' },
        ],
      },
      {
        name: 'caniforia',
        items: [
          { name: 'deploy', detail: 'main · 2 panes', state: 'idle' },
          { name: 'logs', detail: 'tail -f', state: 'busy' },
        ],
      },
    ],
    paneTabs: ['claude', 'server', 'git'],
    stateLabels: { waiting: 'Waiting for you', busy: 'Working', idle: '' },
    terminal: [
      { kind: 'prompt', text: 'claude' },
      { kind: 'dim', text: '  ⏵ reading src/lib/layout.ts' },
      { kind: 'dim', text: '  ⏵ reading src/state/useAttention.ts' },
      { kind: 'plain', text: 'The drag target is computed from the pane tree, not the tmux' },
      { kind: 'plain', text: 'layout, so splitting the view never sends a tmux command.' },
      { kind: 'blank', text: '' },
      { kind: 'attention', text: '  Apply this change to layout.ts?' },
      { kind: 'plain', text: '  1. Yes   2. Yes, and don’t ask again   3. No' },
      { kind: 'cursor', text: '  ❯ ' },
    ],
  },
  steps: {
    title: 'Three lines from nothing to running',
    items: [
      {
        n: '01',
        title: 'Run the installer',
        body: 'It puts tmux in place if you lack it, pulls the server from npm, and hands it to launchd or systemd so it returns after a reboot.',
      },
      {
        n: '02',
        title: 'Open the link it prints',
        body: 'It waits for the server, then prints a localhost URL carrying a token. Open that in any browser on the machine.',
      },
      {
        n: '03',
        title: 'Carry on where you left off',
        body: 'The windows you already had are waiting on the left — nothing restarted, nothing reattached, nothing moved.',
      },
    ],
  },
  features: {
    title: 'It runs on its own, and calls when it needs you',
    items: [
      {
        icon: 'terminal',
        title: 'Open the tmux you already have',
        body: 'Your live sessions open in the browser exactly as they are — nothing migrated, copied, or restarted. You pick up mid-thought.',
      },
      {
        icon: 'nodes',
        title: 'Every machine, one rail',
        body: 'This machine and every server you ssh into, gathered in a single rail — each host with its own tasks, all a glance away.',
      },
      {
        icon: 'signal',
        title: 'Know the moment it needs you',
        body: 'The instant a CLI stops to ask something, its task lights up. Work on anything else until it does — no watching required.',
      },
      {
        icon: 'checklist',
        title: 'Every subagent, tracked on its own',
        body: 'When a CLI fans out into subagents, each one becomes its own tracked task — you see what every branch is doing and which is waiting, not a single opaque "working…".',
      },
      {
        icon: 'history',
        title: 'Disconnect, keep running',
        body: 'Close the tab or drop the SSH link; the work runs on inside tmux. Reconnect whenever, and it is exactly where you left it.',
      },
      {
        icon: 'power',
        title: 'Survives a reboot',
        body: 'Reboot, and your workspace returns on its own — the same tasks, the same panes, ready without a thing rebuilt by hand.',
      },
      {
        icon: 'shield',
        title: 'Nothing leaves your machine',
        body: 'The whole workspace runs on your own hardware. Output, keystrokes, files, keys — none of it is ever uploaded.',
      },
      {
        icon: 'image',
        title: 'A quarter of the image tokens',
        body: 'Screenshots are optimised on their way to the model — the same picture at a quarter of the image tokens, with nothing extra to do.',
      },
      {
        icon: 'phone',
        title: 'On your phone, too',
        body: 'The same workspace opens on your phone — check a task, answer a prompt, or drive a remote server while you are away from your desk.',
      },
    ],
  },
  // Punchy selling-point numbers, no mechanism — the "how" lives in the app, not the pitch.
  // `to` drives the count-up; a null `to` is a qualitative tile that shows an icon instead.
  stats: {
    eyebrow: 'By the numbers',
    items: [
      { to: 75, unit: '%', icon: null, label: 'fewer image tokens' },
      { to: 70, unit: '%', icon: null, label: 'smaller image uploads' },
      { to: null, unit: '', icon: 'shield', label: 'never asks for your files' },
    ],
  },
  // Benefit-led selling points, no mechanics. Icon + a single terse line each.
  sells: {
    eyebrow: 'And these',
    items: [
      { icon: 'history', label: 'Your sessions are never lost' },
      { icon: 'signal', label: 'It pings you when a task needs you' },
      { icon: 'power', label: 'Tasks survive a reboot' },
      { icon: 'nodes', label: 'Every remote machine in one place' },
      { icon: 'phone', label: 'Works from your phone' },
      { icon: 'shield', label: 'Local-only — we collect nothing' },
    ],
  },
  extension: {
    label: 'Chrome extension',
    title: 'Or keep it in the sidebar',
    body: 'The same workspace runs as a Chrome side panel, next to whatever you are reading. It adds an element picker: click a region of any page and its URL, CSS selector and HTML fragment drop straight into your CLI input line — so "this bit, here" becomes something an AI can actually act on.',
    cta: 'See the extension',
  },
  security: {
    label: 'Where it runs',
    title: 'On your machine, and nowhere else',
    body: 'This site is a page and a shell script, with one optional account service beside it — that is the whole of tmux.online. The server, the sessions, the CLIs and your keys never leave hardware you own.',
    points: [
      'The server listens on 127.0.0.1 alone; reaching any other address takes a token you pass on purpose.',
      'Every connection is checked against its Origin, which a web page cannot forge — so a tab you happen to leave open can never reach in.',
      'Remote machines go through your own ssh config. No relay, no telemetry, and no sign-in unless you go looking for one.',
    ],
  },
  faq: {
    title: 'Questions',
    items: [
      {
        q: 'Will it change my tmux setup?',
        a: 'It writes nothing to your config. It works against one session — main unless you pass --tmux-session — and only ever reads the others. Windows it resized are set back to automatic when you close the page.',
      },
      {
        q: 'What do I need first?',
        a: 'tmux and Node.js 22.5 or newer.',
      },
      {
        q: 'Does it work on a remote server?',
        a: 'Yes — run the same line there. Then, from the page you already have open, add the machine as a host and connect. Its tasks appear in the rail under its own name, alongside your local ones.',
      },
      {
        q: 'Do I have to install the extension?',
        a: 'No. The server hosts the web version itself, at 127.0.0.1:16666. The extension adds the side panel and the element picker on top of it.',
      },
      {
        q: 'Does anything get sent to tmux.online?',
        a: 'Not unless you sign in, and you never have to. The install script fetches from npm; after that nothing reports anywhere. If you do create an account, the only things it holds are your GitHub identity and the devices you have authorised — never your sessions, your keystrokes or your keys.',
      },
      {
        q: 'Do I need an account?',
        a: 'No. Everything on this page works signed out, on your own machines, forever. An account exists only for the few things that cannot work without one — authorising a CLI on a machine you do not have a browser on, and issuing API keys for scripts. Signing in is one GitHub click and revoking it is one more.',
      },
      {
        q: 'How do I get rid of it?',
        a: 'Remove the launchd agent or systemd user unit the installer wrote, then npm uninstall -g ai-anywhere-server. Your tmux sessions carry on untouched.',
      },
    ],
  },
  cta: {
    title: 'Let the terminal keep running — so you can stop watching it.',
    body: 'One line to install, one link to open. Then look away.',
  },
  footer: {
    rights: 'Open source. Run it on your own machines.',
    columns: [
      {
        title: 'Project',
        links: [
          { label: 'GitHub', href: REPO_URL },
          { label: 'Issues', href: ISSUES_URL },
        ],
      },
      {
        title: 'Install',
        links: [
          { label: 'install.sh', href: INSTALL_URL },
          { label: 'ai-anywhere-server', href: NPM_URL },
        ],
      },
    ],
    langLabel: 'Language',
  },
  // The optional account. Nothing on the landing page depends on any of this — see the
  // "Do I need an account?" entry in the FAQ above.
  auth: {
    signInWithGitHub: 'Continue with GitHub',
    signOut: 'Sign out',
    loading: 'Checking…',
    genericError: 'Something went wrong. Try again in a moment.',
    networkError: 'Could not reach the account service.',
  },
  account: {
    metaTitle: 'Account — tmux.online',
    metaDescription: 'Manage the optional tmux.online account: your GitHub identity and the API keys you have issued.',
    label: 'Account',
    signedOutTitle: 'Sign in to tmux.online',
    signedOutBody:
      'An account is optional. AI Anywhere runs on your own machines without one — this exists only to authorise a CLI on a machine you cannot open a browser on, and to issue API keys for scripts.',
    signedInAs: 'Signed in as',
    keysTitle: 'API keys',
    keysBody: 'Long-lived credentials for scripts and CI. Send one as an x-api-key header. Revoking a key takes effect immediately.',
    keysEmpty: 'No keys yet.',
    keyNameLabel: 'Name',
    keyNamePlaceholder: 'ci-deploy',
    keyCreate: 'Create key',
    keyCreating: 'Creating…',
    keyCreatedTitle: 'Copy this key now',
    keyCreatedBody: 'It is stored hashed and will never be shown again. If you lose it, revoke the key and make another.',
    keyCopy: 'Copy',
    keyCopied: 'Copied',
    keyRevoke: 'Revoke',
    keyRevokeConfirm: 'Revoke this key? Anything using it stops working immediately.',
    keyCreatedAt: 'Created',
    keyNameRequired: 'Give the key a name so you can tell it apart later.',
  },
  device: {
    metaTitle: 'Authorise a device — tmux.online',
    metaDescription: 'Approve or deny a device that is asking to sign in to your tmux.online account.',
    label: 'Device',
    title: 'Authorise a device',
    body: 'A device is asking to sign in as you. Check that the code below matches the one it printed, then approve it.',
    codeLabel: 'Code from the device',
    codePlaceholder: 'ABCD-1234',
    continue: 'Continue',
    signInFirst: 'Sign in first, and we will bring you straight back here.',
    approve: 'Approve',
    deny: 'Deny',
    working: 'Working…',
    approvedTitle: 'Device approved',
    approvedBody: 'You can close this tab — the device has been told.',
    deniedTitle: 'Device denied',
    deniedBody: 'Nothing was authorised. You can close this tab.',
    invalidCode: 'That code is not valid. Check it against the one the device printed.',
    expiredCode: 'That code has expired. Ask the device for a new one.',
    missingCode: 'Enter the code the device printed.',
  },
  notFound: {
    code: '404',
    title: 'No pane here',
    body: 'That address does not exist on this site.',
    cta: 'Back to the start',
  },
}
