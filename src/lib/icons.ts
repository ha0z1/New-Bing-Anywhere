/**
 * Line icons on a 24px grid at 1.5px stroke, as raw inner SVG.
 *
 * The table lives here rather than inside Icon.astro because the React islands need the
 * same glyphs, and two copies of the same path data is exactly the kind of thing that
 * silently drifts. Both `Icon.astro` and `islands/Icon.tsx` render from this.
 *
 * `github` is the one solid mark and opts out of the shared stroke.
 */
export const iconPaths = {
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="m7.5 9.5 2.8 2.8-2.8 2.8"/><path d="M13.5 15.1h3.4"/>',
  layout: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M9 4.4V19.6"/><path d="M9.4 9.5H20.6"/>',
  nodes:
    '<circle cx="12" cy="5" r="2.2"/><circle cx="5" cy="18.5" r="2.2"/><circle cx="19" cy="18.5" r="2.2"/><path d="m10.7 6.9-4.4 9.4"/><path d="m13.3 6.9 4.4 9.4"/>',
  signal:
    '<path d="M12 16.5v3.8"/><circle cx="12" cy="13" r="1.1"/><path d="M8.9 9.6a4.4 4.4 0 0 1 6.2 0"/><path d="M6.2 6.6a8.3 8.3 0 0 1 11.6 0"/>',
  phone: '<rect x="6.8" y="2.4" width="10.4" height="19.2" rx="2.4"/><path d="M10.6 18.6h2.8"/>',
  image:
    '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="8.3" cy="9.6" r="1.5"/><path d="m4 18 5-5 3.5 3.5 3-3 4.5 4.5"/>',
  history: '<path d="M3.4 12a8.6 8.6 0 1 0 2.7-6.3L3.2 8.4"/><path d="M3 3.4v5h5"/><path d="M12 8v4.3l3 1.8"/>',
  shield: '<path d="M12 3.2 4.8 6v5.6c0 4.4 3 7.6 7.2 9.2 4.2-1.6 7.2-4.8 7.2-9.2V6Z"/><path d="m9.2 12.2 2 2 3.6-4"/>',
  arrowRight: '<path d="M4.5 12h14"/><path d="m12.8 6.2 5.8 5.8-5.8 5.8"/>',
  arrowUpRight: '<path d="M7.2 16.8 16.8 7.2"/><path d="M8.6 7.2h8.2v8.2"/>',
  copy: '<rect x="9" y="9" width="11.5" height="11.5" rx="2.2"/><path d="M15.6 5.9v-.4a2 2 0 0 0-2-2H5.5a2 2 0 0 0-2 2v8.1a2 2 0 0 0 2 2h.4"/>',
  check: '<path d="m4.8 12.6 4.8 4.8L19.4 7.6"/>',
  checklist: '<path d="m3.4 7.2 1.7 1.7 3-3"/><path d="M11 7.4h9.6"/><path d="m3.4 15.8 1.7 1.7 3-3"/><path d="M11 16h9.6"/>',
  plus: '<path d="M12 5.5v13"/><path d="M5.5 12h13"/>',
  globe: '<circle cx="12" cy="12" r="8.8"/><path d="M3.3 12h17.4"/><path d="M12 3.2a12.4 12.4 0 0 1 0 17.6 12.4 12.4 0 0 1 0-17.6"/>',
  chevronDown: '<path d="m6.8 9.8 5.2 5.2 5.2-5.2"/>',
  star: '<path fill="currentColor" stroke="none" d="m12 3.6 2.55 5.17 5.7.83-4.12 4.02.97 5.68L12 16.6l-5.1 2.5.97-5.68L3.75 9.6l5.7-.83z"/>',
  power: '<path d="M12 3.2v7.4"/><path d="M6.9 6.4a7.6 7.6 0 1 0 10.2 0"/>',
  logOut: '<path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10"/><path d="M14.5 8.5 18 12l-3.5 3.5"/><path d="M9 12h9"/>',
  user: '<circle cx="12" cy="8.2" r="3.6"/><path d="M4.9 20.2a7.4 7.4 0 0 1 14.2 0"/>',
  key: '<circle cx="8" cy="15.8" r="3.9"/><path d="m10.9 13.2 8-8"/><path d="m15.4 8.7 2.1 2.1"/><path d="m17.7 6.4 2.1 2.1"/>',
  gift: '<path d="M4.5 11.5h15V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19Z"/><path d="M3.5 8h17v3.5h-17z"/><path d="M12 8v12.5"/><path d="M12 8S10.8 4 8.6 4a2.1 2.1 0 0 0 0 4Z"/><path d="M12 8s1.2-4 3.4-4a2.1 2.1 0 0 1 0 4Z"/>',
  users:
    '<circle cx="9" cy="8.4" r="3.4"/><path d="M3.4 20a5.6 5.6 0 0 1 11.2 0"/><path d="M16.2 5.3a3.4 3.4 0 0 1 0 6.2"/><path d="M17.4 14.6A5.6 5.6 0 0 1 20.6 20"/>',
  crown: '<path d="M4 8.5 7.5 12 12 5.5 16.5 12 20 8.5 18.4 18H5.6Z"/><path d="M5.6 18h12.8"/>',
  trash:
    '<path d="M4.6 6.6h14.8"/><path d="M9.4 6.6V4.9a1.4 1.4 0 0 1 1.4-1.4h2.4a1.4 1.4 0 0 1 1.4 1.4v1.7"/><path d="M17.6 6.6 17 19a1.6 1.6 0 0 1-1.6 1.5H8.6A1.6 1.6 0 0 1 7 19l-.6-12.4"/>',
  github:
    '<path fill="currentColor" stroke="none" d="M12 2C6.48 2 2 6.58 2 12.23c0 4.51 2.87 8.34 6.84 9.69.5.1.68-.22.68-.49l-.01-1.9c-2.78.62-3.37-1.22-3.37-1.22-.46-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.57 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9l-.01 2.82c0 .27.18.59.69.49A10.04 10.04 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z"/>',
} as const

export type IconName = keyof typeof iconPaths
