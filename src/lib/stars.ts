/** 2116 → "2.1k", 950 → "950". Matches how GitHub itself abbreviates a star count. */
export const formatStars = (n: number): string => {
  if (n < 1000) return String(n)
  const thousands = n / 1000
  // One decimal below 10k (2.1k), none above (12k) — same thresholds as GitHub's UI.
  const text = thousands.toFixed(thousands < 10 ? 1 : 0)
  return `${text.replace(/\.0$/, '')}k`
}
