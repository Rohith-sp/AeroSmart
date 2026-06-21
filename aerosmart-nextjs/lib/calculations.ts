// ─── Hazard Score (mirrors brain.py exactly) ───────────────────────────────
export function calculateHazardScore(temp: number, gas: number, light: number): number {
  const gasFactor = Math.max(0, Math.min(100, ((gas - 300) / 600) * 100));
  const tempMultiplier = 1.0 + Math.max(0, (temp - 28) * 0.05);
  const occupancyPenalty = light > 400 ? 15 : 0;
  return Math.min(100, Math.round((gasFactor * tempMultiplier) + occupancyPenalty));
}

// ─── Motor Health Index (mirrors brain.py exactly) ─────────────────────────
export const BASELINE_POWER = 4.5; // Watts

export function calculateMotorHealth(power: number): number {
  if (power < 1.0) return 100;
  const deviationPct = Math.abs(((power - BASELINE_POWER) / BASELINE_POWER) * 100);
  return Math.max(0, Math.min(100, Math.round(100 - deviationPct)));
}

// ─── XAI Breakdown Components ──────────────────────────────────────────────
export function getXaiBreakdown(temp: number, gas: number, light: number) {
  const gasFactor = Math.max(0, Math.min(100, ((gas - 300) / 600) * 100));
  const tempMultiplier = 1.0 + Math.max(0, (temp - 28) * 0.05);
  const occupancyPenalty = light > 400 ? 15 : 0;
  return {
    gasFactor: parseFloat(gasFactor.toFixed(1)),
    tempMultiplier: parseFloat(tempMultiplier.toFixed(2)),
    occupancyPenalty,
    occupied: light > 400,
  };
}

// ─── XAI Action Badge Logic ────────────────────────────────────────────────
export function getXaiAction(hazardScore: number, motorActive: boolean, prevMotorActive?: boolean) {
  if (motorActive) return 'exhaust' as const;
  if (!motorActive && prevMotorActive) return 'fan-off' as const;
  if (hazardScore >= 50) return 'alert' as const;
  return 'normal' as const;
}

// ─── Motor Deviation ───────────────────────────────────────────────────────
export function getDeviationPct(power: number): number {
  return parseFloat(((power - BASELINE_POWER) / BASELINE_POWER * 100).toFixed(1));
}

// ─── Hazard Score Color ────────────────────────────────────────────────────
export function getHazardColor(score: number) {
  if (score < 40) return { color: 'var(--green)', bg: 'var(--green-mid)', chip: 'chip-green', label: 'Normal' };
  if (score < 75) return { color: 'var(--amber)', bg: 'var(--amber-mid)', chip: 'chip-amber', label: 'Moderate' };
  return { color: 'var(--red)', bg: 'var(--red-mid)', chip: 'chip-red', label: 'Critical' };
}

// ─── Motor Health Color ────────────────────────────────────────────────────
export function getHealthColor(health: number) {
  if (health >= 85) return { color: 'var(--green)', bg: 'var(--green-mid)', chip: 'chip-green', label: 'Healthy' };
  if (health >= 65) return { color: 'var(--amber)', bg: 'var(--amber-mid)', chip: 'chip-amber', label: 'Watch' };
  return { color: 'var(--red)', bg: 'var(--red-mid)', chip: 'chip-red', label: 'Degrade' };
}

// ─── Format timestamp ─────────────────────────────────────────────────────
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour12: false });
}
