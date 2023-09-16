export const bingOrgaincSearch = async (query: string): Promise<string> => {
  const text = await fetch(`https://www.bing.com/search?q=${encodeURIComponent(query)}`).then((d) => d.text())
  return text
}
