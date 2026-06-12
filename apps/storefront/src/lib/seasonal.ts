export type Season = 'winter' | 'spring' | 'summer' | 'autumn'

export function getCurrentSeason(now: Date = new Date()): Season {
  const month = now.getMonth() + 1 // 1–12
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter' // month 12, 1, 2
}

export function getCurrentMonth(now: Date = new Date()): number {
  return now.getMonth() + 1 // 1–12
}
