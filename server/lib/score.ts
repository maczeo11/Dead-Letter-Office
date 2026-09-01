// Pure fns — testable, no DB. Weighted hygiene: hard + 0.3·soft
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

/**
 * Status transition for a lead after one bounce event.
 * Hard bounce quarantines immediately; soft bounces only escalate at the
 * threshold. BOUNCED is terminal — a later soft bounce must not "downgrade"
 * a quarantined address back to RISKY.
 */
export const nextLeadStatus = (current: string, isHard: boolean, softCount: number): string => {
  if (current === 'BOUNCED') return 'BOUNCED'
  if (isHard) return 'BOUNCED'
  if (softCount >= RISKY_AFTER_SOFT) return 'RISKY'
  return current
}
