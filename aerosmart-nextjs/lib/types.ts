// Mirrors the Supabase `telemetry` table schema exactly.
// When hardware is live, brain.py inserts these fields every 2 minutes.
export interface TelemetryRow {
  id: number;
  created_at: string; // ISO timestamp
  temperature: number; // °C — DHT11
  gas: number;         // PPM — MQ135
  light: number;       // raw ADC — LDR (>400 = occupied)
  voltage: number;     // V
  current: number;     // A
  power: number;       // W = voltage × current
  hazard_score: number; // 0–100 composite
  motor_active: boolean; // true = fan was triggered this window
}

// Derived metrics computed client-side from a TelemetryRow
export interface DerivedMetrics {
  motorHealth: number;       // 0–100%
  energyWh: number;          // accumulated Wh this session
  occupied: boolean;         // light > 400
  gasFactor: number;         // for XAI breakdown
  tempMultiplier: number;    // for XAI breakdown
  occupancyPenalty: number;  // for XAI breakdown
  deviationPct: number;      // % above baseline power
  xaiAction: 'exhaust' | 'alert' | 'fan-off' | 'normal';
}

export type TabId = 'live' | 'analytics' | 'xai';
export type TimeFilter = '1h' | '24h' | '7d';
