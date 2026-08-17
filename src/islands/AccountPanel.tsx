import { useEffect, useRef, useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { Icon } from './Icon'
import { copyText } from '../lib/clipboard'
import { devices as devicesApi, keys as keysApi, type AccountDevice, type ApiKey, type CreatedApiKey } from '../lib/api'
import type { Copy, Lang } from '../i18n'
import { dashboardKeys } from '../lib/dashboardCache'
import { useDashboardCacheReady } from './DashboardCache'
import MembershipPanel from './MembershipPanel'
import '../styles/auth.css'

interface Props {
  copy: Pick<Copy, 'auth' | 'account' | 'membership'>
  lang: Lang
  section: 'devices' | 'api-keys' | 'membership'
}

const message = (error: unknown, fallback: string) => (error instanceof Error && error.message) || fallback

export default function AccountPanel({ copy, lang, section }: Props) {
  const { auth, account } = copy
  const cacheReady = useDashboardCacheReady()

  const {
    data: apiKeys,
    error: apiKeysRequestError,
    mutate: mutateApiKeys,
  } = useSWR(cacheReady && section === 'api-keys' ? dashboardKeys.apiKeys : null, keysApi.list, { keepPreviousData: true })
  const {
    data: devices,
    error: devicesRequestError,
    mutate: mutateDevices,
  } = useSWR(cacheReady && section === 'devices' ? dashboardKeys.devices : null, devicesApi.list, {
    keepPreviousData: true,
    refreshInterval: 15_000,
  })

  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [keyError, setKeyError] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [deviceError, setDeviceError] = useState<string | null>(null)
  const [revokingDevice, setRevokingDevice] = useState<string | null>(null)

  const nameInput = useRef<HTMLInputElement>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    return () => clearTimeout(copyTimer.current)
  }, [])

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
      const optimisticId = `pending-${Date.now()}`
      let created: CreatedApiKey | undefined
      await mutateApiKeys(
        async (current = []) => {
          created = await keysApi.create(trimmed)
          return [created, ...current.filter((key) => key.id !== optimisticId)]
        },
        {
          optimisticData: (current = []) => [{ id: optimisticId, name: trimmed, createdAt: new Date().toISOString() }, ...current],
          populateCache: true,
          revalidate: true,
          rollbackOnError: true,
        },
      )
      if (created?.key) setRevealed(created.key)
      setName('')
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
      await mutateApiKeys(
        async (current = []) => {
          await keysApi.remove(key.id)
          return current.filter((item) => item.id !== key.id)
        },
        {
          optimisticData: (current = []) => current.filter((item) => item.id !== key.id),
          populateCache: true,
          revalidate: true,
          rollbackOnError: true,
        },
      )
    } catch (error) {
      setKeyError(message(error, auth.genericError))
    } finally {
      setRevoking(null)
    }
  }

  const onRevokeDevice = async (device: AccountDevice) => {
    if (!confirm(account.deviceRevokeConfirm.replace('{name}', device.name))) return
    setRevokingDevice(device.id)
    try {
      await mutateDevices(
        async (current = []) => {
          await devicesApi.revoke(device.id)
          return current.filter((item) => item.id !== device.id)
        },
        {
          optimisticData: (current = []) => current.filter((item) => item.id !== device.id),
          populateCache: true,
          revalidate: true,
          rollbackOnError: true,
        },
      )
    } catch (error) {
      setDeviceError(message(error, auth.genericError))
    } finally {
      setRevokingDevice(null)
    }
  }

  const onCopy = async () => {
    if (!revealed || !(await copyText(revealed))) return
    setCopied(true)
    clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(false), 1600)
  }

  if (section === 'membership') {
    if (!cacheReady) return <p className="aa-muted">{auth.loading}</p>
    return <MembershipPanel copy={{ auth, membership: copy.membership }} lang={lang} />
  }

  const apiKeysError = keyError || (apiKeysRequestError ? message(apiKeysRequestError, auth.genericError) : null)
  const devicesError = deviceError || (devicesRequestError ? message(devicesRequestError, auth.genericError) : null)

  if (section === 'devices') {
    return (
      <div className="aa-capability">
        <h1>
          <Icon name="terminal" size={21} />
          {account.devicesTitle}
        </h1>
        <p className="aa-lede">{account.devicesBody}</p>
        {devicesError && <p className="aa-error">{devicesError}</p>}
        {!devices && !devicesError && <p className="aa-muted">{auth.loading}</p>}
        {devices && devices.length > 0 && (
          <ul className="aa-key-list">
            {devices.map((device) => (
              <li key={device.id}>
                <div className="aa-key-meta">
                  <span className="aa-key-name aa-device-name">
                    <span className={`aa-device-dot${device.online ? ' is-online' : ''}`} aria-hidden />
                    {device.name}
                  </span>
                  <span className="aa-key-sub">
                    {device.online ? account.deviceOnline : account.deviceOffline} · {device.platform} · {device.arch} · CLI{' '}
                    {device.cliVersion} · {account.deviceLastSeen} {new Date(device.lastSeenAt).toLocaleString()}
                  </span>
                </div>
                <button
                  className="aa-btn aa-btn-small aa-btn-danger"
                  type="button"
                  onClick={() => onRevokeDevice(device)}
                  disabled={revokingDevice === device.id}
                >
                  {account.deviceRevoke}
                </button>
              </li>
            ))}
          </ul>
        )}
        {devices && devices.length === 0 && <p className="aa-muted">{account.devicesEmpty}</p>}
      </div>
    )
  }

  return (
    <div className="aa-capability">
      <h1>
        <Icon name="key" size={21} />
        {account.keysTitle}
      </h1>
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
      {apiKeysError && <p className="aa-error">{apiKeysError}</p>}
      {!apiKeys && !apiKeysError && <p className="aa-muted">{auth.loading}</p>}

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
                    key.start ? `${key.start}…` : '',
                    key.createdAt ? `${account.keyCreatedAt} ${new Date(key.createdAt).toLocaleDateString()}` : '',
                  ]
                    .filter(Boolean)
                    .join('  ·  ')}
                </span>
              </div>
              <button
                className="aa-btn aa-btn-small"
                type="button"
                onClick={() => onRevoke(key)}
                disabled={key.id.startsWith('pending-') || revoking === key.id}
              >
                {account.keyRevoke}
              </button>
            </li>
          ))}
        </ul>
      )}
      {apiKeys && apiKeys.length === 0 && <p className="aa-muted">{account.keysEmpty}</p>}
    </div>
  )
}
