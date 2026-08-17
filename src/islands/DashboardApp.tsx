import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import { getCachedSession, getSession, refreshSession, signIn } from '../lib/api'
import { dashboardKeys } from '../lib/dashboardCache'
import type { Copy, Lang } from '../i18n'
import AccountPanel from './AccountPanel'
import DashboardCache from './DashboardCache'
import DevicePanel from './DevicePanel'
import { Icon } from './Icon'
import '../styles/auth.css'
import '../styles/dashboard.css'

type Section = 'devices' | 'api-keys' | 'membership' | 'device'
type Phase = 'loading' | 'out' | 'in'

interface Props {
  lang: Lang
  copy: Pick<Copy, 'auth' | 'account' | 'membership' | 'device' | 'dashboard'>
}

interface ScreenProps {
  copy: Props['copy']
  lang: Lang
  phase: Phase
  section: Section
}

const routeBySection: Record<Section, string> = {
  devices: '/devices',
  'api-keys': '/api-keys',
  membership: '/membership',
  device: '/device',
}

const message = (error: unknown, fallback: string) => (error instanceof Error && error.message) || fallback

function getSectionTitle(copy: Props['copy'], section: Section): string {
  if (section === 'devices') return copy.account.devicesTitle
  if (section === 'api-keys') return copy.account.keysTitle
  if (section === 'membership') return copy.membership.title
  return copy.device.title
}

function SignedOut({ copy }: Pick<Props, 'copy'>) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSignIn = async () => {
    setBusy(true)
    setError(null)
    try {
      await signIn(location.origin + location.pathname + location.search)
    } catch (problem) {
      setBusy(false)
      setError(message(problem, copy.auth.genericError))
    }
  }

  return (
    <>
      <h1>{copy.account.signedOutTitle}</h1>
      <p className="aa-lede">{copy.account.signedOutBody}</p>
      <button className="aa-btn aa-btn-primary" type="button" onClick={onSignIn} disabled={busy}>
        <Icon name="github" size={17} />
        <span>{copy.auth.signInWithGitHub}</span>
      </button>
      {error && <p className="aa-error">{error}</p>}
    </>
  )
}

function DashboardScreen({ copy, lang, phase, section }: ScreenProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const authenticated = phase === 'in'
  const narrow = section === 'device' || !authenticated
  const openDevices = useCallback(() => navigate('/devices', { replace: true }), [navigate])
  const pageTitle = getSectionTitle(copy, section)

  const nav = [
    { id: 'devices', label: copy.account.devicesTitle, icon: 'terminal' },
    { id: 'api-keys', label: copy.account.keysTitle, icon: 'key' },
    { id: 'membership', label: copy.membership.navTitle, icon: 'gift' },
  ] as const

  useEffect(() => {
    document.title = `${pageTitle}${copy.dashboard.titleSuffix}`

    document.querySelectorAll<HTMLAnchorElement>('[data-lang-menu] a[hreflang]').forEach((link) => {
      const prefix = link.hreflang === 'en' ? '' : `/${link.hreflang}`
      link.href = `${prefix}/dashboard${routeBySection[section]}${location.search}`
    })
  }, [copy.dashboard.titleSuffix, location.search, pageTitle, section])

  let content: ReactNode
  if (phase === 'loading') {
    content = <p className="aa-muted">{copy.auth.loading}</p>
  } else if (section === 'device') {
    content = <DevicePanel authenticated={authenticated} copy={{ auth: copy.auth, device: copy.device }} onApproved={openDevices} />
  } else if (authenticated) {
    content = (
      <AccountPanel
        key={section}
        lang={lang}
        section={section}
        copy={{ auth: copy.auth, account: copy.account, membership: copy.membership }}
      />
    )
  } else {
    content = <SignedOut copy={copy} />
  }

  return (
    <section className="dashboard-shell" data-dashboard-app data-auth-state={phase}>
      <div className={`wrap dashboard-layout${authenticated ? '' : ' dashboard-layout-standalone'}`}>
        {authenticated && (
          <aside className="dashboard-sidebar">
            <p className="dashboard-label">{copy.dashboard.label}</p>
            <nav className="dashboard-nav" aria-label={copy.dashboard.navLabel}>
              {nav.map((item) => (
                <NavLink key={item.id} to={routeBySection[item.id]}>
                  <Icon name={item.icon} size={17} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
        )}

        <div className={`dashboard-content${narrow ? ' dashboard-content-narrow' : ''}`}>{content}</div>
      </div>
    </section>
  )
}

function DashboardRoutes({ copy, lang, phase }: Pick<Props, 'copy' | 'lang'> & { phase: Phase }) {
  return (
    <Routes>
      <Route index element={<Navigate to="/devices" replace />} />
      <Route path="devices" element={<DashboardScreen copy={copy} lang={lang} phase={phase} section="devices" />} />
      <Route path="api-keys" element={<DashboardScreen copy={copy} lang={lang} phase={phase} section="api-keys" />} />
      <Route path="membership" element={<DashboardScreen copy={copy} lang={lang} phase={phase} section="membership" />} />
      <Route path="device" element={<DashboardScreen copy={copy} lang={lang} phase={phase} section="device" />} />
      <Route path="*" element={<Navigate to="/devices" replace />} />
    </Routes>
  )
}

export default function DashboardApp({ copy, lang }: Props) {
  const [cachedSession] = useState(getCachedSession)
  const initialSession = useRef(true)
  const {
    data: session,
    error: sessionError,
    mutate: mutateSession,
  } = useSWR(
    dashboardKeys.session,
    () => {
      if (!initialSession.current) return refreshSession()
      initialSession.current = false
      return getSession()
    },
    { fallbackData: cachedSession },
  )

  useEffect(() => {
    const syncSession = (event: StorageEvent) => {
      if (event.key !== 'aa_auth_sync') return
      // Header.astro starts the authoritative request before this listener runs and exposes
      // it through getSession(), so the dashboard joins that request instead of duplicating it.
      void mutateSession(getSession(), { revalidate: false })
    }

    window.addEventListener('storage', syncSession)
    return () => window.removeEventListener('storage', syncSession)
  }, [mutateSession])

  const phase: Phase = session ? 'in' : session === undefined && !sessionError ? 'loading' : 'out'
  const basename = lang === 'en' ? '/dashboard' : `/${lang}/dashboard`

  const routes = <DashboardRoutes copy={copy} lang={lang} phase={phase} />

  return (
    <BrowserRouter basename={basename}>
      {session?.user.id ? (
        <DashboardCache key={session.user.id} userId={session.user.id}>
          {routes}
        </DashboardCache>
      ) : (
        routes
      )}
    </BrowserRouter>
  )
}
