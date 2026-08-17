import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { SWRConfig, type Cache } from 'swr'
import { clearExpiredDashboardCache, loadDashboardCache, sanitizeDashboardData, saveDashboardCache } from '../lib/dashboardCache'

const HYDRATION_TIMEOUT = 100
const DashboardCacheReady = createContext(true)

interface Props {
  children: ReactNode
  userId: string
}

export const useDashboardCacheReady = (): boolean => useContext(DashboardCacheReady)

export default function DashboardCache({ children, userId }: Props) {
  const cache = useMemo<Cache>(() => new Map(), [])
  const fingerprints = useRef(new Map<string, string>())
  const [ready, setReady] = useState(false)

  const config = useMemo(
    () => ({
      provider: () => cache,
      onSuccess: (data: unknown, key: string) => {
        const safeData = sanitizeDashboardData(key, data)
        if (safeData === undefined) return

        const fingerprint = JSON.stringify(safeData)
        if (fingerprints.current.get(key) === fingerprint) return
        fingerprints.current.set(key, fingerprint)

        void saveDashboardCache(userId, key, safeData).catch(() => {
          if (fingerprints.current.get(key) === fingerprint) fingerprints.current.delete(key)
        })
      },
    }),
    [cache, userId],
  )

  useEffect(() => {
    let active = true
    let settled = false

    const finishHydration = (entries?: Map<string, unknown>) => {
      if (!active || settled) return
      settled = true

      for (const [key, data] of entries ?? []) {
        fingerprints.current.set(key, JSON.stringify(data))
        cache.set(key, { data })
      }
      setReady(true)
    }

    void loadDashboardCache(userId).then(finishHydration)
    const timeout = window.setTimeout(() => finishHydration(), HYDRATION_TIMEOUT)

    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [cache, userId])

  useEffect(() => {
    void clearExpiredDashboardCache()
    const timer = window.setInterval(() => void clearExpiredDashboardCache(), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <SWRConfig value={config}>
      <DashboardCacheReady.Provider value={ready}>{children}</DashboardCacheReady.Provider>
    </SWRConfig>
  )
}
