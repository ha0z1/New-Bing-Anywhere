/**
 * Device authorisation (RFC 8628) — the browser half of `ai-anywhere login`.
 *
 * The ordering below is not arbitrary. `device.claim` is the ONLY thing that binds a device
 * code to a user, and only when a session cookie rides along on that request. Approving
 * without it fails with an opaque 400.
 */
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Icon } from './Icon'
import { ApiError, device, signIn } from '../lib/api'
import type { Copy } from '../i18n'
import '../styles/auth.css'

interface Props {
  authenticated: boolean
  copy: Pick<Copy, 'auth' | 'device'>
  onApproved: () => void
}

type Phase = 'loading' | 'ask' | 'out' | 'confirm' | 'approved' | 'denied'

/** The restricted alphabet has no dashes, so a code read off a terminal as "ABCD-1234" still resolves. */
const normalise = (value: string | null) => (value || '').trim().replace(/[\s-]/g, '').toUpperCase()

export default function DevicePanel({ authenticated, copy, onApproved }: Props) {
  const { auth, device: txt } = copy

  const describe = useCallback(
    (error: unknown) => {
      const code = error instanceof ApiError ? error.code : undefined
      if (code === 'expired_token') return txt.expiredCode
      if (code === 'invalid_grant' || code === 'invalid_request') return txt.invalidCode
      return (error instanceof Error && error.message) || auth.genericError
    },
    [auth.genericError, txt.expiredCode, txt.invalidCode],
  )

  const [phase, setPhase] = useState<Phase>('loading')
  const [userCode, setUserCode] = useState('')
  const [typed, setTyped] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const codeInput = useRef<HTMLInputElement>(null)

  const ask = useCallback((problem: string | null) => {
    setError(problem)
    setPhase('ask')
  }, [])

  const start = useCallback(
    async (code: string) => {
      if (!code) return ask(null)

      setPhase('loading')

      if (!authenticated) return setPhase('out')

      // THE BINDING STEP — see the note at the top of this file.
      try {
        await device.claim(code)
      } catch (problem) {
        return ask(describe(problem))
      }

      setError(null)
      setPhase('confirm')
    },
    [ask, authenticated, describe],
  )

  useEffect(() => {
    const initial = normalise(new URLSearchParams(location.search).get('user_code'))
    setUserCode(initial)
    setTyped(initial)
    void start(initial)
  }, [start])

  useEffect(() => {
    if (phase === 'ask') codeInput.current?.focus()
  }, [phase])

  useEffect(() => {
    if (phase !== 'approved') return
    const timer = setTimeout(onApproved, 3000)
    return () => clearTimeout(timer)
  }, [onApproved, phase])

  const onSubmitCode = (event: FormEvent) => {
    event.preventDefault()
    const next = normalise(typed)
    if (!next) return setError(txt.missingCode)

    setUserCode(next)
    // Put the code in the URL so the sign-in round trip can bring it back.
    history.replaceState(null, '', `${location.pathname}?user_code=${encodeURIComponent(next)}`)
    void start(next)
  }

  const onSignIn = async () => {
    setBusy(true)
    setError(null)
    try {
      // Come back to this exact page with the code intact.
      await signIn(`${location.origin}${location.pathname}?user_code=${encodeURIComponent(userCode)}`)
    } catch (problem) {
      setBusy(false)
      setError(describe(problem))
    }
  }

  const decide = (action: 'approve' | 'deny') => async () => {
    setBusy(true)
    setError(null)
    try {
      await device[action](userCode)
      setPhase(action === 'approve' ? 'approved' : 'denied')
    } catch (problem) {
      setError(describe(problem))
    } finally {
      setBusy(false)
    }
  }

  if (phase === 'loading') return <p className="aa-muted">{auth.loading}</p>

  if (phase === 'approved' || phase === 'denied') {
    const ok = phase === 'approved'
    return (
      <>
        <span className={ok ? 'aa-mark aa-mark-ok' : 'aa-mark'}>
          <Icon name={ok ? 'check' : 'shield'} size={22} />
        </span>
        <h1>{ok ? txt.approvedTitle : txt.deniedTitle}</h1>
        <p className="aa-lede">{ok ? txt.approvedBody : txt.deniedBody}</p>
      </>
    )
  }

  return (
    <>
      <h1>{txt.title}</h1>

      {phase === 'ask' && (
        <form className="aa-code-form" onSubmit={onSubmitCode}>
          <label htmlFor="user-code">{txt.codeLabel}</label>
          <input
            id="user-code"
            ref={codeInput}
            className="aa-input aa-code-input"
            type="text"
            autoComplete="one-time-code"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={12}
            placeholder={txt.codePlaceholder}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
          />
          <button className="aa-btn aa-btn-primary" type="submit">
            {txt.continue}
          </button>
        </form>
      )}

      {phase === 'out' && (
        <button className="aa-btn aa-btn-primary" type="button" onClick={onSignIn} disabled={busy}>
          <Icon name="github" size={17} />
          <span>{auth.signInWithGitHub}</span>
        </button>
      )}

      {phase === 'confirm' && (
        <>
          <p className="aa-lede">{txt.body}</p>
          <p className="aa-code">{userCode}</p>
          <div className="aa-actions">
            <button className="aa-btn aa-btn-primary" type="button" onClick={decide('approve')} disabled={busy}>
              {busy ? txt.working : txt.approve}
            </button>
            <button className="aa-btn" type="button" onClick={decide('deny')} disabled={busy}>
              {busy ? txt.working : txt.deny}
            </button>
          </div>
        </>
      )}

      {error && <p className="aa-error">{error}</p>}
    </>
  )
}
