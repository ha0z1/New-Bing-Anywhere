const MAX_AGE = 1000 * 60 * 60 * 1 // 1 hour
const KEY = 'notification'
const FLAG_KEY = 'notification:hide'
const getRemoteNotification = async () => {
  // console.log('getRemoteNotification')
  let data
  try {
    data = await fetch('https://api.github.com/repos/haozi/New-Bing-Anywhere/issues/24').then(async (res) => await res.json())
  } catch {}
  return data
}

export const getNotification = async () => {
  const { [KEY]: oldData } = await chrome.storage.local.get(KEY)

  if (!oldData || (oldData.lastModify && Date.now() - oldData.lastModify > MAX_AGE)) {
    await chrome.storage.local.remove(KEY)
    const data = await getRemoteNotification()

    if (data) {
      await chrome.storage.local.set({ [KEY]: { data, lastModify: Date.now() } })
    }
  }

  const { [FLAG_KEY]: flag, [KEY]: newData } = await chrome.storage.local.get([FLAG_KEY, KEY])

  if (!newData?.data) return null
  if (!(newData.data.title && newData.data.state === 'open')) return null
  if (flag === 1 && newData.data.title === oldData.data?.title) return null
  await chrome.storage.local.remove(FLAG_KEY)
  return newData.data
}

export const hideNotification = async () => {
  chrome.storage.local.set({ [FLAG_KEY]: 1 })
}
