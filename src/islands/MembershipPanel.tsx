import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import { Icon } from './Icon'
import { copyText } from '../lib/clipboard'
import { membership as membershipApi, ApiError, type DownlinePage, type Membership } from '../lib/api'
import { SITE_URL } from '../config'
import type { Copy, Lang } from '../i18n'
import { dashboardKeys, referralPageKey } from '../lib/dashboardCache'
import { normalizeInviteCode } from '../lib/referral'
import '../styles/auth.css'

interface Props {
  copy: Pick<Copy, 'auth' | 'membership'>
  lang: Lang
}

/** Fill `{token}` placeholders — word order stays with each locale's template, not this code. */
const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''))

const DAY = 86_400_000
const SECOND = 1000
const DAY_SECONDS = DAY / SECOND
const COUNTDOWN_DECIMALS = 5
const INVITE_BONUS_DAYS = 7
const REFERRAL_KEY = 'aa_ref'
const REFERRAL_CAPTURED_AT_KEY = 'aa_ref_at'
const DATE_LOCALES: Record<Lang, string> = {
  en: 'en-US',
  ja: 'ja-JP',
  ko: 'ko-KR',
  'zh-Hant': 'zh-TW',
}

type InviteMode = 'link' | 'code'

function formatCampaignDeadline(lang: Lang, now = new Date()): string {
  const deadline = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return new Intl.DateTimeFormat(DATE_LOCALES[lang], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(deadline)
}

function useCampaignDeadline(lang: Lang): string {
  const [deadline, setDeadline] = useState(() => formatCampaignDeadline(lang))

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const updateAtMidnight = () => {
      const now = new Date()
      setDeadline(formatCampaignDeadline(lang, now))
      const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      timer = setTimeout(updateAtMidnight, nextDay.getTime() - Date.now() + SECOND)
    }

    updateAtMidnight()
    return () => clearTimeout(timer)
  }, [lang])

  return deadline
}

const clearPendingReferral = (): void => {
  try {
    localStorage.removeItem(REFERRAL_KEY)
    localStorage.removeItem(REFERRAL_CAPTURED_AT_KEY)
  } catch {
    // Best effort; referredBy on the server still prevents a second binding.
  }

  const url = new URL(location.href)
  if (!url.searchParams.has('ref') && !url.searchParams.has('t')) return
  url.searchParams.delete('ref')
  url.searchParams.delete('t')
  history.replaceState(history.state, '', url)
}

const pendingReferral = (): string => {
  const params = new URLSearchParams(location.search)
  return params.has('t') || params.has('ref') ? normalizeInviteCode(params.has('t') ? params.get('t') : params.get('ref')) : ''
}

const maskReferralName = (value: string | null | undefined, fallback: string): string => {
  const name = value?.trim() ?? ''
  const characters = Array.from(name)
  if (characters.length === 0) return fallback
  if (name.includes('**')) return name
  return `${characters[0]}**${characters.at(-1)}`
}

const fetchReferralPage = ([, cursor]: readonly [string, string | null]) => membershipApi.referrals(cursor ?? undefined)

function withInviteBonus(status: Membership): Membership {
  const expiry = Date.parse(status.trialExpiresAt)
  return {
    ...status,
    referredBy: 'pending',
    trialExpiresAt: Number.isFinite(expiry) ? new Date(expiry + INVITE_BONUS_DAYS * DAY).toISOString() : status.trialExpiresAt,
  }
}

interface TrialCountdownProps {
  expiresAt: string
  template: string
  ended: string
}

function TrialCountdown({ expiresAt, template, ended }: TrialCountdownProps): ReactNode {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const expiry = Date.parse(expiresAt)
    const current = Date.now()
    setNow(current)
    if (!Number.isFinite(expiry) || expiry <= current) return

    const timer = setInterval(() => {
      const next = Date.now()
      setNow(next)
      if (next >= expiry) clearInterval(timer)
    }, SECOND)
    return () => clearInterval(timer)
  }, [expiresAt])

  const expiry = Date.parse(expiresAt)
  const remainingSeconds = Number.isFinite(expiry) ? Math.max(0, Math.ceil((expiry - now) / SECOND)) : 0
  if (remainingSeconds === 0) return ended

  const [before, after = ''] = template.split('{n}')
  const remainingDays = (remainingSeconds / DAY_SECONDS).toFixed(COUNTDOWN_DECIMALS)

  return (
    <span className="aa-trial-countdown">
      {before}
      <span className="aa-trial-countdown-value">{remainingDays}</span>
      {after}
    </span>
  )
}

/**
 * AccountPanel mounts this only after the shared session has resolved as signed in, so this
 * component owns membership data alone and never duplicates the authentication UI.
 */
export default function MembershipPanel({ copy, lang }: Props) {
  const { auth, membership: m } = copy
  const deadline = useCampaignDeadline(lang)

  const {
    data: status,
    error: statusRequestError,
    mutate: mutateStatus,
  } = useSWR<Membership>(dashboardKeys.membership, membershipApi.status, { keepPreviousData: true })
  const {
    data: referralPages,
    error: referralsRequestError,
    isLoading: referralsLoading,
    isValidating: referralsValidating,
    size: referralPageCount,
    setSize: setReferralPageCount,
  } = useSWRInfinite<DownlinePage>(referralPageKey, fetchReferralPage, { keepPreviousData: true, persistSize: true })

  const [code, setCode] = useState('')
  const [binding, setBinding] = useState(false)
  const [bindError, setBindError] = useState<string | null>(null)

  const [inviteMode, setInviteMode] = useState<InviteMode>('link')
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const pendingReferralHandled = useRef(false)

  const downline = referralPages?.flatMap((page) => page.items) ?? []
  const cursor = referralPages?.at(-1)?.nextCursor ?? null
  const loadingMore = referralsLoading || (referralsValidating && referralPages?.[referralPageCount - 1] === undefined)

  useEffect(() => {
    return () => clearTimeout(copyTimer.current)
  }, [])

  useEffect(() => {
    if (status) window.dispatchEvent(new CustomEvent('aa:membership-change', { detail: status }))
  }, [status])

  useEffect(() => {
    if (!status || pendingReferralHandled.current) return
    pendingReferralHandled.current = true

    const pending = pendingReferral()
    if (status.tier === 'permanent') {
      if (pending) clearPendingReferral()
      return
    }
    if (status.referredBy !== null) {
      if (pending) clearPendingReferral()
      return
    }
    if (!pending) return

    setBinding(true)
    void mutateStatus(
      async () => {
        try {
          const next = await membershipApi.bindInviteCode(pending)
          clearPendingReferral()
          return next
        } catch (error) {
          const machine = error instanceof ApiError ? error.code : undefined
          setBindError((machine && (m.bindErrors as Record<string, string>)[machine]) || auth.genericError)
          if (machine && Object.hasOwn(m.bindErrors, machine)) clearPendingReferral()
          throw error
        }
      },
      { optimisticData: withInviteBonus(status), populateCache: true, revalidate: true, rollbackOnError: true, throwOnError: false },
    ).finally(() => setBinding(false))
  }, [auth.genericError, m.bindErrors, mutateStatus, status])

  const onBind = async (event: FormEvent) => {
    event.preventDefault()
    const normalized = normalizeInviteCode(code)
    if (!status) return
    if (!normalized) {
      setBindError(m.bindErrors.invalid_code || auth.genericError)
      return
    }

    setBinding(true)
    setBindError(null)
    try {
      await mutateStatus(() => membershipApi.bindInviteCode(normalized), {
        optimisticData: withInviteBonus(status),
        populateCache: true,
        revalidate: true,
        rollbackOnError: true,
      })
      setCode('')
      clearPendingReferral()
    } catch (error) {
      const machine = error instanceof ApiError ? error.code : undefined
      setBindError((machine && (m.bindErrors as Record<string, string>)[machine]) || auth.genericError)
      if (machine && Object.hasOwn(m.bindErrors, machine)) clearPendingReferral()
    } finally {
      setBinding(false)
    }
  }

  const onCopyInvite = async () => {
    if (!status) return
    const value = inviteMode === 'link' ? `${SITE_URL}/?t=${status.inviteCode}` : status.inviteCode
    if (!(await copyText(value))) return
    setCopied(true)
    clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(false), 1600)
  }

  const selectInviteMode = (mode: InviteMode) => {
    setInviteMode(mode)
    setCopied(false)
    clearTimeout(copyTimer.current)
  }

  const onInviteTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const mode = inviteMode === 'link' ? 'code' : 'link'
    selectInviteMode(mode)
    document.getElementById(`invite-${mode}-tab`)?.focus()
  }

  if (!status) {
    return (
      <div className="aa-capability">
        <h1>
          <Icon name="gift" size={21} />
          {m.title}
        </h1>
        <p className={statusRequestError ? 'aa-error' : 'aa-muted'}>{statusRequestError ? auth.genericError : auth.loading}</p>
      </div>
    )
  }

  const inviteLink = `${SITE_URL}/?t=${status.inviteCode}`
  const inviteValue = inviteMode === 'link' ? inviteLink : status.inviteCode
  const inviteDescription = inviteMode === 'link' ? m.inviteBody : m.inviteCodeBody
  const inviteCopyLabel = inviteMode === 'link' ? m.inviteCopy : m.inviteCodeCopy
  const isPermanent = status.tier === 'permanent'
  const remaining = Math.max(0, status.threshold - status.points)
  const progress = Math.min(100, Math.round((status.points / Math.max(1, status.threshold)) * 100))
  return (
    <div className="aa-capability aa-invite">
      <h1>
        <Icon name="gift" size={21} />
        {m.title}
      </h1>
      <p className="aa-lede">{m.intro}</p>
      {!isPermanent && <p className="aa-campaign-deadline">{fill(m.deadline, { deadline })}</p>}

      <section className="aa-campaign-progress">
        <h2>
          <Icon name="users" size={18} />
          {m.progressTitle}
        </h2>
        <p className="aa-progress-count">{fill(m.progressCount, { points: status.points, threshold: status.threshold })}</p>
        <p className="aa-progress-remaining">{isPermanent ? m.progressComplete : fill(m.progressRemaining, { n: remaining })}</p>

        <div className="aa-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="aa-tier">
          <span className={`aa-tier-badge ${isPermanent ? 'aa-tier-permanent' : 'aa-tier-trial'}`}>
            <Icon name={isPermanent ? 'crown' : 'gift'} size={15} />
            {isPermanent ? m.tierPermanent : m.tierTrial}
          </span>
          <span className="aa-tier-status">
            {isPermanent ? (
              m.permanentBody
            ) : (
              <TrialCountdown expiresAt={status.trialExpiresAt} template={m.trialLeft} ended={m.trialEnded} />
            )}
          </span>
        </div>
      </section>

      <div className="aa-revealed aa-invite-link">
        <div className="aa-invite-tabs" role="tablist" aria-label={m.inviteModeLabel}>
          <button
            id="invite-link-tab"
            type="button"
            role="tab"
            aria-selected={inviteMode === 'link'}
            aria-controls="invite-value"
            tabIndex={inviteMode === 'link' ? 0 : -1}
            onClick={() => selectInviteMode('link')}
            onKeyDown={onInviteTabKeyDown}
          >
            {m.inviteLinkTab}
          </button>
          <button
            id="invite-code-tab"
            type="button"
            role="tab"
            aria-selected={inviteMode === 'code'}
            aria-controls="invite-value"
            tabIndex={inviteMode === 'code' ? 0 : -1}
            onClick={() => selectInviteMode('code')}
            onKeyDown={onInviteTabKeyDown}
          >
            {m.inviteCodeTab}
          </button>
        </div>
        <div id="invite-value" role="tabpanel" aria-labelledby={`invite-${inviteMode}-tab`}>
          <p className="aa-muted">{inviteDescription}</p>
          <div className="aa-revealed-row">
            <code>{inviteValue}</code>
            <button className="aa-btn" type="button" onClick={onCopyInvite}>
              {copied ? m.inviteCopied : inviteCopyLabel}
            </button>
          </div>
        </div>
      </div>

      <div className="aa-downline">
        <h2>
          <Icon name="users" size={18} />
          {m.downlineTitle}
        </h2>
        <p className="aa-downline-hint">{m.downlineRevenueHint}</p>
        {!referralPages && !referralsRequestError ? (
          <p className="aa-muted">{auth.loading}</p>
        ) : referralsRequestError && downline.length === 0 ? (
          <p className="aa-error">{auth.genericError}</p>
        ) : downline.length === 0 ? (
          <div className="aa-downline-empty">
            <p className="aa-muted">{m.downlineEmpty}</p>
            <p>{m.downlineEmptyCta}</p>
          </div>
        ) : (
          <ul className="aa-ref-list">
            {downline.map((person, index) => (
              <li key={`${index}-${person.joinedAt ?? ''}`}>
                <div className="aa-key-meta">
                  <span className="aa-key-name">{maskReferralName(person.name, m.downlineAnon)}</span>
                  {person.joinedAt && (
                    <span className="aa-key-sub">
                      {m.downlineJoined} {new Date(person.joinedAt).toLocaleDateString(DATE_LOCALES[lang])}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {cursor && (
          <button
            className="aa-btn aa-btn-more"
            type="button"
            onClick={() => void setReferralPageCount(referralPageCount + 1)}
            disabled={loadingMore}
          >
            {loadingMore ? m.downlineLoading : m.downlineMore}
          </button>
        )}
      </div>

      {/* Manual binding remains available once, but stays secondary to this campaign. */}
      {!isPermanent && status.referredBy === null && (
        <form className="aa-bind" onSubmit={onBind}>
          <p className="aa-bind-title">{m.bindTitle}</p>
          <p className="aa-muted">{m.bindBody}</p>
          <div className="aa-key-form">
            <label className="aa-sr-only" htmlFor="invite-code">
              {m.bindTitle}
            </label>
            <input
              id="invite-code"
              className="aa-input aa-input-code"
              type="text"
              autoComplete="off"
              spellCheck={false}
              maxLength={32}
              placeholder={m.bindPlaceholder}
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
            <button className="aa-btn aa-btn-primary" type="submit" disabled={binding || !code.trim()}>
              {binding ? m.binding : m.bind}
            </button>
          </div>
          {bindError && <p className="aa-error">{bindError}</p>}
        </form>
      )}
    </div>
  )
}
