/**
 * The account API, as a typed module.
 *
 * This was previously a `window.aa` global defined by an inline script in <head>, because
 * the site shipped no bundler output at all. The islands changed that: they are bundled
 * anyway, so the client can be an ordinary import — typed, tree-shaken, and reachable from
 * a component without going through the window object.
 *
 * The session cookie needs no special handling: tmux.online and api.tmux.online share a
 * registrable domain, so they are same-site and the default SameSite=Lax cookie rides along.
 * `credentials: 'include'` is still required — cross-origin fetches omit cookies by default
 * regardless of SameSite.
 *
 * Contract: `docs/frontend-integration.md` in the AA-Server repo.
 */
import { API_URL } from '../config'

export interface User {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export interface Session {
  user: User
}

export interface ApiKey {
  id: string
  name?: string | null
  start?: string | null
  createdAt?: string | null
}

export interface CreatedApiKey extends ApiKey {
  /** Returned exactly once, at creation. Stored hashed, never retrievable again. */
  key?: string
}

export class ApiError extends Error {
  status: number
  /** Machine-readable code from the API body, e.g. `expired_token`. */
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(API_URL + path, { credentials: 'include', ...init })

  let body: any = null
  try {
    body = await response.json()
  } catch {
    // Some endpoints answer 204 with no body; that is not an error.
  }

  if (!response.ok) {
    const message = body?.error_description || body?.message || body?.error || `HTTP ${response.status}`
    throw new ApiError(message, response.status, body?.code || body?.error)
  }

  return body as T
}

const post = <T>(path: string, payload?: unknown): Promise<T> =>
  request<T>(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
  })

/**
 * The current session, or null. Never throws — signed out and offline both render fine.
 *
 * Deduplicated across the page: the header resolves the same endpoint from its own inline
 * script (it must not import this module, or the marketing pages would pull in the island
 * bundle), and it parks the in-flight promise on `window.__aaSession`. Without this the
 * account page would ask twice, and the second answer is what the first render waits on.
 */
export const getSession = (): Promise<Session | null> => {
  const shared = window as typeof window & { __aaSession?: Promise<Session | null> }

  shared.__aaSession ??= request<Session>('/api/auth/get-session')
    .then((data) => (data?.user ? data : null))
    .catch(() => null)

  return shared.__aaSession
}

/**
 * Start GitHub OAuth and leave the page. `callbackURL` must be absolute: a relative one
 * resolves against the API's own baseURL, which would land the user on api.tmux.online.
 */
export const signIn = async (callbackURL: string): Promise<never> => {
  const data = await post<{ url?: string }>('/api/auth/sign-in/social', {
    provider: 'github',
    callbackURL,
    // Keeps this a plain 200 + JSON. Without it the response also carries a Location header;
    // fetch does not follow it, but if it ever did the request would go cross-origin to
    // github.com and fail CORS with an opaque TypeError.
    disableRedirect: true,
  })

  if (!data?.url) throw new Error('no authorization url returned')
  location.href = data.url

  // Navigation has been requested but this frame keeps running; never resolve, so callers
  // do not flash a "done" state on their way out.
  return new Promise<never>(() => {})
}

export const signOut = (): Promise<unknown> => post('/api/auth/sign-out')

export const keys = {
  list: async (): Promise<ApiKey[]> => {
    const data = await request<ApiKey[] | { apiKeys?: ApiKey[] }>('/api/auth/api-key/list')
    return Array.isArray(data) ? data : (data?.apiKeys ?? [])
  },
  create: (name: string): Promise<CreatedApiKey> => post('/api/auth/api-key/create', { name }),
  remove: (keyId: string): Promise<unknown> => post('/api/auth/api-key/delete', { keyId }),
}

export const device = {
  /**
   * Claim a device code for the signed-in user. This is the step it is easy to leave out,
   * and leaving it out makes approve fail: it is the ONLY thing that binds the code to a
   * user, and only when a session cookie rides along on this request.
   */
  claim: (userCode: string): Promise<unknown> => request(`/api/auth/device?user_code=${encodeURIComponent(userCode)}`),
  approve: (userCode: string): Promise<unknown> => post('/api/auth/device/approve', { userCode }),
  deny: (userCode: string): Promise<unknown> => post('/api/auth/device/deny', { userCode }),
}

export type Tier = 'trial' | 'member' | 'permanent'

export interface Membership {
  tier: Tier
  /** ISO 8601. createdAt + trial window. Only meaningful while tier === 'trial'. */
  trialExpiresAt: string
  /** Downline count. */
  points: number
  /** Downline needed for the permanent tier. */
  threshold: number
  inviteCode: string
  /** Upline id, or null when the user may still redeem a code. */
  referredBy: string | null
}

export interface Downline {
  name?: string | null
  image?: string | null
  joinedAt?: string | null
}

export interface DownlinePage {
  items: Downline[]
  nextCursor: string | null
}

export const membership = {
  /** The caller's entitlement + own invite code. Safe to call on every account-page load. */
  status: (): Promise<Membership> => request('/membership'),
  /** Redeem someone else's code, once. Errors carry a code: invalid_code | already_redeemed | self_invite | cycle. */
  redeem: (code: string): Promise<Membership> => post('/membership/redeem', { code }),
  /** The caller's downline, newest first. Pass the previous page's `nextCursor` verbatim. */
  referrals: (cursor?: string): Promise<DownlinePage> =>
    request(`/membership/referrals${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`),
}
