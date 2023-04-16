const callMethod = async (method: string, args: any[]) => {
  return await new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        method,
        args: [...args]
      },
      (res) => {
        if (!res || res.code !== 200) {
          reject(res?.msg)
        } else {
          resolve(res.data)
        }
      }
    )
  })
}

export const openUrlInSameTab = async (url: string) => {
  try {
    return await callMethod('openUrlInSameTab', [{ url }])
  } catch (e) {
    // console.error(e)
    location.href = url
  }
}

export const mutationConfig = { attributes: true, childList: true, subtree: true }
