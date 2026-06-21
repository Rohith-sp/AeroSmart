import { TelemetryRow } from './types';

/**
 * Mock telemetry data generator.
 * Mirrors the exact fields that brain.py writes to Supabase.
 * When hardware is live, replace useLiveTelemetry's mock calls with real Supabase queries.
 */

const BASELINE_POWER = 4.5;

function randomBetween(min: number, max: number, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateRow(index: number, baseTime: Date): TelemetryRow {
  const t = new Date(baseTime.getTime() - index * 120_000); // 2-min intervals

  const isSpike = Math.random() > 0.85;

  const temp     = isSpike ? randomBetween(30, 38, 1) : randomBetween(22, 27, 1);
  const gas      = isSpike ? Math.round(randomBetween(700, 950, 0)) : Math.round(randomBetween(200, 420, 0));
  const light    = Math.round(randomBetween(100, 800, 0));
  const voltage  = randomBetween(8.8, 9.2, 2);
  const current  = isSpike ? randomBetween(0.8, 1.5, 3) : randomBetween(0.42, 0.60, 3);
  const power    = parseFloat((voltage * current).toFixed(3));

  const gasFactor        = Math.max(0, Math.min(100, ((gas - 300) / 600) * 100));
  const tempMultiplier   = 1.0 + Math.max(0, (temp - 28) * 0.05);
  const occupancyPenalty = light > 400 ? 15 : 0;
  const hazard_score     = Math.min(100, Math.round((gasFactor * tempMultiplier) + occupancyPenalty));
  const motor_active     = hazard_score > 75;

  return {
    id: t.getTime(), // unique per row — timestamp in ms
    created_at: t.toISOString(),
    temperature: temp,
    gas,
    light,
    voltage,
    current,
    power,
    hazard_score,
    motor_active,
  };
}

/** Generate N rows of mock telemetry in descending timestamp order */
export function generateMockTelemetry(count: number = 60): TelemetryRow[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => generateRow(i, now));
}

/** Singleton stable mock dataset so charts don't re-randomize on every render */
let _cachedMock: TelemetryRow[] | null = null;
export function getMockTelemetry(count = 60): TelemetryRow[] {
  if (!_cachedMock || _cachedMock.length < count) {
    _cachedMock = generateMockTelemetry(count);
  }
  return _cachedMock.slice(0, count);
}

/** Simulate a new incoming row (called every 2s in mock mode) */
export function generateLatestMockRow(): TelemetryRow {
  return generateRow(0, new Date());
}
