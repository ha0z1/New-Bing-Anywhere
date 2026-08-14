/**
 * Copy text, falling back to the legacy path when the async Clipboard API is unavailable —
 * it is refused outside a secure context and in some embedded browsers.
 *
 * The install command on the landing page repeats this in its own inline script rather than
 * importing this module: that page ships no bundle at all, and pulling one in for ten lines
 * would cost it a request it does not otherwise make.
 */
export const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const scratch = document.createElement('textarea')
    scratch.value = text
    scratch.setAttribute('readonly', '')
    scratch.style.cssText = 'position:fixed;top:-9999px;opacity:0'
    document.body.append(scratch)
    scratch.select()

    let copied = false
    try {
      copied = document.execCommand('copy')
    } catch {
      copied = false
    }

    scratch.remove()
    return copied
  }
}
