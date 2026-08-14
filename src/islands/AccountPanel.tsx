import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Icon } from './Icon'
import { copyText } from '../lib/clipboard'
import { getSession, keys as keysApi, signIn, signOut, type ApiKey, type CreatedApiKey, type User } from '../lib/api'
import type { Copy } from '../i18n'
import '../styles/auth.css'

interface Props {
  copy: Pick<Copy, 'auth' | 'account'>
}

type Phase = 'loading' | 'out' | 'in'

const message = (error: unknown, fallback: string) => (error instanceof Error && error.message) || fallback

export default function AccountPanel({ copy }: Props) {
  const { auth, account } = copy

  const [phase, setPhase] = useState<Phase>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[] | null>(null)

  const [signInBusy, setSignInBusy] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [keyError, setKeyError] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)

  const nameInput = useRef<HTMLInputElement>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const refreshKeys = useCallback(async () => {
    try {
      setApiKeys(await keysApi.list())
    } catch (error) {
      setKeyError(message(error, auth.genericError))
    }
  }, [auth.genericError])

  useEffect(() => {
    let live = true

    getSession().then((session) => {
      if (!live) return
      if (!session) return setPhase('out')
      setUser(session.user)
      setPhase('in')
      void refreshKeys()
    })

    return () => {
      live = false
      clearTimeout(copyTimer.current)
    }
  }, [refreshKeys])

  const onSignIn = async () => {
    setSignInBusy(true)
    setSignInError(null)
    try {
      // Land back here, not on the home page — the user came for their account.
      await signIn(location.origin + location.pathname)
    } catch (error) {
      setSignInBusy(false)
      setSignInError(message(error, auth.genericError))
    }
  }

  const onSignOut = async () => {
    try {
      await signOut()
    } finally {
      // Reload either way: if sign-out half-succeeded, the reload shows the true state.
      location.reload()
    }
  }

  const onCreate = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()

    if (!trimmed) {
      setKeyError(account.keyNameRequired)
      nameInput.current?.focus()
      return
    }

    setKeyError(null)
    setCreating(true)
    try {
      const created: CreatedApiKey = await keysApi.create(trimmed)
      if (created?.key) setRevealed(created.key)
      setName('')
      await refreshKeys()
    } catch (error) {
      setKeyError(message(error, auth.genericError))
    } finally {
      setCreating(false)
    }
  }

  const onRevoke = async (key: ApiKey) => {
    if (!confirm(account.keyRevokeConfirm)) return
    setRevoking(key.id)
    try {
      await keysApi.remove(key.id)
      await refreshKeys()
    } catch (error) {
      setKeyError(message(error, auth.genericError))
    } finally {
      setRevoking(null)
    }
  }

  const onCopy = async () => {
    if (!revealed || !(await copyText(revealed))) return
    setCopied(true)
    clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(false), 1600)
  }

  if (phase === 'loading') return <p className="aa-muted">{auth.loading}</p>

  if (phase === 'out') {
    return (
      <>
        <h1>{account.signedOutTitle}</h1>
        <p className="aa-lede">{account.signedOutBody}</p>
        <button className="aa-btn aa-btn-primary" type="button" onClick={onSignIn} disabled={signInBusy}>
          <Icon name="github" size={17} />
          <span>{auth.signInWithGitHub}</span>
        </button>
        {signInError && <p className="aa-error">{signInError}</p>}
      </>
    )
  }

  return (
    <>
      <h1 className="aa-who">
        <span className="aa-muted">{account.signedInAs}</span>
        <span>{user?.name || user?.email || ''}</span>
      </h1>
      {user?.email && <p className="aa-muted aa-email">{user.email}</p>}
      <p style={{ marginTop: 20 }}>
        <button className="aa-btn" type="button" onClick={onSignOut}>
          {auth.signOut}
        </button>
      </p>

      <div className="aa-keys">
        <h2>
          <Icon name="key" size={18} />
          {account.keysTitle}
        </h2>
        <p className="aa-lede">{account.keysBody}</p>

        <form className="aa-key-form" onSubmit={onCreate}>
          <label className="aa-sr-only" htmlFor="key-name">
            {account.keyNameLabel}
          </label>
          <input
            id="key-name"
            ref={nameInput}
            className="aa-input"
            type="text"
            autoComplete="off"
            spellCheck={false}
            maxLength={64}
            placeholder={account.keyNamePlaceholder}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <button className="aa-btn aa-btn-primary" type="submit" disabled={creating}>
            {creating ? account.keyCreating : account.keyCreate}
          </button>
        </form>
        {keyError && <p className="aa-error">{keyError}</p>}

        {/* Shown once, after creation: the API stores the key hashed and never returns it again. */}
        {revealed && (
          <div className="aa-revealed">
            <p className="aa-revealed-title">{account.keyCreatedTitle}</p>
            <p className="aa-muted">{account.keyCreatedBody}</p>
            <div className="aa-revealed-row">
              <code>{revealed}</code>
              <button className="aa-btn" type="button" onClick={onCopy}>
                {copied ? account.keyCopied : account.keyCopy}
              </button>
            </div>
          </div>
        )}

        {apiKeys && apiKeys.length > 0 && (
          <ul className="aa-key-list">
            {apiKeys.map((key) => (
              <li key={key.id}>
                <div className="aa-key-meta">
                  <span className="aa-key-name">{key.name || key.id}</span>
                  <span className="aa-key-sub">
                    {[
                      // `start` is the leading characters the API keeps for identification.
                      key.start ? `${key.start}…` : '',
                      key.createdAt ? `${account.keyCreatedAt} ${new Date(key.createdAt).toLocaleDateString()}` : '',
                    ]
                      .filter(Boolean)
                      .join('  ·  ')}
                  </span>
                </div>
                <button className="aa-btn aa-btn-small" type="button" onClick={() => onRevoke(key)} disabled={revoking === key.id}>
                  {account.keyRevoke}
                </button>
              </li>
            ))}
          </ul>
        )}
        {apiKeys && apiKeys.length === 0 && <p className="aa-muted">{account.keysEmpty}</p>}
      </div>
    </>
  )
}
