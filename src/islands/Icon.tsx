import { iconPaths, type IconName } from '../lib/icons'

interface Props {
  name: IconName
  size?: number
  className?: string
}

/** The React twin of Icon.astro. Same glyph table, same 24px grid, same stroke. */
export function Icon({ name, size = 20, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      // Static, hand-authored path data from a module in this repo — no user input reaches it.
      dangerouslySetInnerHTML={{ __html: iconPaths[name] }}
    />
  )
}
