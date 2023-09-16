export const googleOrgaincSearch = async (query: string): Promise<string> => {
  const text = await fetch(`https://www.google.com/search?q=${encodeURIComponent(query)}`).then((d) => d.text())
  return text
}
