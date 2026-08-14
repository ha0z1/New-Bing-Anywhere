import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Icon } from './Icon'
import { copyText } from '../lib/clipboard'
import { getSession, membership as membershipApi, ApiError, type Downline, type Membership } from '../lib/api'
import { SITE_URL } from '../config'
import type { Copy } from '../i18n'
import '../styles/auth.css'

interface Props {
  copy: Pick<Copy, 'auth' | 'membership'>
}

/** Fill `{token}` placeholders — word order stays with each locale's template, not this code. */
const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''))

const tierIcon = { trial: 'gift', member: 'users', permanent: 'crown' } as const

const DAY = 86_400_000

/**
 * The invite / referral / membership panel. A second island on /account, mounted beside
 * AccountPanel; both are client:load and share the one session request via window.__aaSession.
 *
 * Renders nothing until a signed-in session and its status resolve — the signed-out UI
 * (and the "Checking…" state) belongs to AccountPanel, which owns sign-in.
 */
export default function MembershipPanel({ copy }: Props) {
  const { auth, membership: m } = copy

  const [status, setStatus] = useState<Membership | null>(null)

  const [code, setCode] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [redeemError, setRedeemError] = useState<string | null>(null)

  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const [downline, setDownline] = useState<Downline[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadReferrals = useCallback(async (next?: string) => {
    setLoadingMore(true)
    try {
      const page = await membershipApi.referrals(next)
      setDownline((prev) => (next ? [...prev, ...page.items] : page.items))
      setCursor(page.nextCursor)
    } catch {
      // A failed downline fetch is non-fatal — keep whatever is already on screen.
    } finally {
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    let live = true

    getSession().then((session) => {
      if (!live || !session) return
      // Prefill from a ?ref= captured on any earlier page view (RefCapture.astro writes it).
      try {
        const saved = localStorage.getItem('aa_ref')
        if (saved) setCode(saved)
      } catch {
        // Storage can be denied (private mode, blocked cookies); the box just stays empty.
      }
      membershipApi
        .status()
        .then((next) => live && setStatus(next))
        .catch(() => {})
      void loadReferrals()
    })

    return () => {
      live = false
      clearTimeout(copyTimer.current)
    }
  }, [loadReferrals])

  const onRedeem = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return

    setRedeeming(true)
    setRedeemError(null)
    try {
      const next = await membershipApi.redeem(trimmed)
      setStatus(next)
      setCode('')
      try {
        localStorage.removeItem('aa_ref')
      } catch {
        // Best-effort cleanup; a stale aa_ref is harmless once referredBy is set.
      }
    } catch (error) {
      const machine = error instanceof ApiError ? error.code : undefined
      setRedeemError((machine && (m.redeemErrors as Record<string, string>)[machine]) || auth.genericError)
    } finally {
      setRedeeming(false)
    }
  }

  const onCopyInvite = async () => {
    if (!status) return
    if (!(await copyText(`${SITE_URL}/?ref=${status.inviteCode}`))) return
    setCopied(true)
    clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(false), 1600)
  }

  if (!status) return null

  const inviteLink = `${SITE_URL}/?ref=${status.inviteCode}`

  let tierStatus: string
  if (status.tier === 'permanent') {
    tierStatus = m.permanentBody
  } else if (status.tier === 'member') {
    tierStatus = fill(m.memberProgress, { points: status.points, threshold: status.threshold })
  } else {
    const days = Math.ceil((Date.parse(status.trialExpiresAt) - Date.now()) / DAY)
    tierStatus = days <= 0 ? m.trialEnded : days === 1 ? m.trialLastDay : fill(m.trialLeft, { n: days })
  }

  const tierLabel = status.tier === 'permanent' ? m.tierPermanent : status.tier === 'member' ? m.tierMember : m.tierTrial
  const progress = Math.min(100, Math.round((status.points / status.threshold) * 100))

  return (
    <div className="aa-keys aa-invite">
      <h2>
        <Icon name="gift" size={18} />
        {m.title}
      </h2>
      <p className="aa-lede">{m.intro}</p>

      <div className="aa-tier">
        <span className={`aa-tier-badge aa-tier-${status.tier}`}>
          <Icon name={tierIcon[status.tier]} size={15} />
          {tierLabel}
        </span>
        <span className="aa-tier-status">{tierStatus}</span>
      </div>

      {status.tier !== 'permanent' && (
        <div className="aa-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="aa-revealed aa-invite-link">
        <p className="aa-revealed-title">{m.inviteTitle}</p>
        <p className="aa-muted">{m.inviteBody}</p>
        <div className="aa-revealed-row">
          <code>{inviteLink}</code>
          <button className="aa-btn" type="button" onClick={onCopyInvite}>
            {copied ? m.inviteCopied : m.inviteCopy}
          </button>
        </div>
      </div>

      {/* The redeem box only appears while the user can still redeem (referredBy is null). */}
      {status.referredBy === null && (
        <form className="aa-redeem" onSubmit={onRedeem}>
          <p className="aa-redeem-title">{m.redeemTitle}</p>
          <p className="aa-muted">{m.redeemBody}</p>
          <div className="aa-key-form">
            <label className="aa-sr-only" htmlFor="invite-code">
              {m.redeemTitle}
            </label>
            <input
              id="invite-code"
              className="aa-input aa-input-code"
              type="text"
              autoComplete="off"
              spellCheck={false}
              maxLength={32}
              placeholder={m.redeemPlaceholder}
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
            <button className="aa-btn aa-btn-primary" type="submit" disabled={redeeming || !code.trim()}>
              {redeeming ? m.redeeming : m.redeem}
            </button>
          </div>
          {redeemError && <p className="aa-error">{redeemError}</p>}
        </form>
      )}

      <div className="aa-downline">
        <h2>
          <Icon name="users" size={18} />
          {m.downlineTitle}
        </h2>
        {downline.length === 0 ? (
          <p className="aa-muted">{m.downlineEmpty}</p>
        ) : (
          <ul className="aa-ref-list">
            {downline.map((person, index) => (
              <li key={`${index}-${person.joinedAt ?? ''}`}>
                {person.image ? (
                  <img className="aa-avatar" src={person.image} alt="" width={30} height={30} referrerPolicy="no-referrer" />
                ) : (
                  <span className="aa-avatar aa-avatar-fallback">
                    <Icon name="user" size={16} />
                  </span>
                )}
                <div className="aa-key-meta">
                  <span className="aa-key-name">{person.name || m.downlineAnon}</span>
                  {person.joinedAt && (
                    <span className="aa-key-sub">
                      {m.downlineJoined} {new Date(person.joinedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {cursor && (
          <button className="aa-btn aa-btn-more" type="button" onClick={() => loadReferrals(cursor)} disabled={loadingMore}>
            {loadingMore ? m.downlineLoading : m.downlineMore}
          </button>
        )}
      </div>
    </div>
  )
}
