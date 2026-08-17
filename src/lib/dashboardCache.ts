import { unstable_serialize } from 'swr/infinite'
import type { AccountDevice, ApiKey, DownlinePage, Membership } from './api'

export const dashboardKeys = {
  session: 'dashboard/session',
  apiKeys: 'dashboard/api-keys',
  devices: 'dashboard/devices',
  membership: 'dashboard/membership',
  referrals: 'dashboard/membership/referrals',
} as const

export const referralPageKey = (_index: number, previous: DownlinePage | null) => {
  if (previous && !previous.nextCursor) return null
  return [dashboardKeys.referrals, previous?.nextCursor ?? null] as const
}

const referralsCacheKey = unstable_serialize(referralPageKey)
const DB_NAME = 'aa-dashboard-swr'
const STORE_NAME = 'entries'
const USER_INDEX = 'userId'
const CACHE_TTL = 60 * 60 * 1000

interface PersistedEntry {
  id: string
  userId: string
  key: string
  savedAt: number
  data: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const isStringOrNull = (value: unknown): value is string | null => typeof value === 'string' || value === null

const optionalString = (value: unknown): string | null | undefined => (isStringOrNull(value) ? value : undefined)

const sanitizeApiKeys = (value: unknown): ApiKey[] | undefined => {
  if (!Array.isArray(value)) return undefined

  return value.flatMap((item) => {
    if (!isRecord(item) || typeof item.id !== 'string' || item.id.startsWith('pending-')) return []
    return [
      {
        id: item.id,
        name: optionalString(item.name),
        start: optionalString(item.start),
        createdAt: optionalString(item.createdAt),
      },
    ]
  })
}

const sanitizeDevices = (value: unknown): AccountDevice[] | undefined => {
  if (!Array.isArray(value)) return undefined

  return value.flatMap((item) => {
    if (
      !isRecord(item) ||
      typeof item.id !== 'string' ||
      typeof item.name !== 'string' ||
      typeof item.platform !== 'string' ||
      typeof item.arch !== 'string' ||
      typeof item.cliVersion !== 'string' ||
      typeof item.createdAt !== 'string' ||
      typeof item.lastSeenAt !== 'string' ||
      typeof item.online !== 'boolean'
    ) {
      return []
    }

    return [
      {
        id: item.id,
        name: item.name,
        platform: item.platform,
        arch: item.arch,
        cliVersion: item.cliVersion,
        createdAt: item.createdAt,
        lastSeenAt: item.lastSeenAt,
        online: item.online,
      },
    ]
  })
}

const sanitizeMembership = (value: unknown): Membership | undefined => {
  if (
    !isRecord(value) ||
    (value.tier !== 'trial' && value.tier !== 'permanent') ||
    typeof value.trialExpiresAt !== 'string' ||
    typeof value.points !== 'number' ||
    typeof value.threshold !== 'number' ||
    typeof value.inviteCode !== 'string' ||
    !isStringOrNull(value.referredBy)
  ) {
    return undefined
  }

  return {
    tier: value.tier,
    trialExpiresAt: value.trialExpiresAt,
    points: value.points,
    threshold: value.threshold,
    inviteCode: value.inviteCode,
    referredBy: value.referredBy === null ? null : 'redacted',
  }
}

const maskName = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const characters = Array.from(value.trim())
  if (characters.length === 0) return null
  if (value.includes('**')) return value
  return `${characters[0]}**${characters.at(-1)}`
}

const sanitizeReferralPages = (value: unknown): DownlinePage[] | undefined => {
  if (!Array.isArray(value)) return undefined

  return value.flatMap((page) => {
    if (!isRecord(page) || !Array.isArray(page.items) || !isStringOrNull(page.nextCursor)) return []

    return [
      {
        items: page.items.flatMap((person) => {
          if (!isRecord(person)) return []
          const joinedAt = optionalString(person.joinedAt)
          return [{ name: maskName(person.name), joinedAt }]
        }),
        nextCursor: page.nextCursor,
      },
    ]
  })
}

export const sanitizeDashboardData = (key: string, value: unknown): unknown | undefined => {
  if (key === dashboardKeys.apiKeys) return sanitizeApiKeys(value)
  if (key === dashboardKeys.devices) return sanitizeDevices(value)
  if (key === dashboardKeys.membership) return sanitizeMembership(value)
  if (key === referralsCacheKey) return sanitizeReferralPages(value)
  return undefined
}

let databasePromise: Promise<IDBDatabase> | undefined

const openDatabase = (): Promise<IDBDatabase> => {
  if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB unavailable'))
  if (databasePromise) return databasePromise

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)

    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
      store.createIndex(USER_INDEX, USER_INDEX)
    }
    request.onsuccess = () => {
      const database = request.result
      database.onversionchange = () => {
        database.close()
        databasePromise = undefined
      }
      resolve(database)
    }
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('IndexedDB upgrade blocked'))
  })

  databasePromise.catch(() => {
    databasePromise = undefined
  })
  return databasePromise
}

export const loadDashboardCache = async (userId: string): Promise<Map<string, unknown>> => {
  try {
    const database = await openDatabase()
    return await new Promise((resolve, reject) => {
      const result = new Map<string, unknown>()
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.index(USER_INDEX).getAll(IDBKeyRange.only(userId))

      request.onsuccess = () => {
        const now = Date.now()
        for (const entry of request.result as PersistedEntry[]) {
          if (now - entry.savedAt > CACHE_TTL) store.delete(entry.id)
          else result.set(entry.key, entry.data)
        }
      }
      transaction.oncomplete = () => resolve(result)
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
  } catch {
    return new Map()
  }
}

export const saveDashboardCache = async (userId: string, key: string, data: unknown): Promise<void> => {
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put({ id: `${userId}:${key}`, userId, key, savedAt: Date.now(), data } satisfies PersistedEntry)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

export const clearExpiredDashboardCache = async (): Promise<void> => {
  try {
    const database = await openDatabase()
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.openCursor()
      const expiredBefore = Date.now() - CACHE_TTL

      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor) return
        if ((cursor.value as PersistedEntry).savedAt <= expiredBefore) cursor.delete()
        cursor.continue()
      }
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
  } catch {
    // Storage can be unavailable in private browsing; SWR's memory cache still works.
  }
}

export const clearDashboardCache = async (): Promise<void> => {
  try {
    const database = await openDatabase()
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).clear()
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
  } catch {
    // A failed browser cache cleanup must not make a successful server logout look failed.
  }
}
