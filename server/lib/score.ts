// Pure fn — testable, no DB. Weighted hygiene: hard + 0.3·soft
export const SOFT_WEIGHT = 0.3
export const RISKY_AFTER_SOFT = 3

export const computeScore = (total: number, hard: number, soft: number): number => {
  if (total === 0) return 100
  return Math.max(0, Math.round(100 - ((hard + SOFT_WEIGHT * soft) / total) * 100))
}

export const computeStatus = (softCount: number): string => {
  if (softCount >= RISKY_AFTER_SOFT) return 'RISKY'
  return 'VALID'
}
