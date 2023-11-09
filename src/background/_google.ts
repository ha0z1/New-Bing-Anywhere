import idmp from 'idmp'

export const googleNaturalSearch = async (query: string): Promise<string> =>
  idmp(
    `googleNaturalSearch${query}`,
    async () => {
      const text = await fetch(`https://www.google.com/search?q=${encodeURIComponent(query)}`).then((d) => d.text())
      return text
    },
    {
      maxAge: 60 * 1000 * 2
    }
  )
