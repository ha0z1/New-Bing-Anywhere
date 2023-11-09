import idmp from 'idmp'

export const bingNaturalSearch = async (query: string) => {
  const key = `bingNaturalSearch${query}`
  return idmp(
    key,
    async () => {
      const text = await fetch(`https://www.bing.com/search?q=${encodeURIComponent(query)}`).then((d) => d.text())
      if (text.includes('id="est_switch"')) {
        idmp.flush(key)
      }
      return text
    },
    {
      maxAge: 60 * 1000 * 2
    }
  )
}
