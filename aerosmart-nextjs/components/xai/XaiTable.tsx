'use client';
import { TelemetryRow } from '@/lib/types';
import { getXaiBreakdown, formatTime } from '@/lib/calculations';

interface XaiTableProps {
  history: TelemetryRow[]; // descending order (newest first)
}

/**
 * Determine what happened in a 2-minute flush window.
 *
 * brain.py writes ONE averaged row per window but sets motor_active = True
 * if the fan fired for ANY packet in that window (even if the window-avg
 * score is low). We handle three distinct cases:
 *
 *  1. motor_active=true  AND avg hazard >= 75  → clean trigger (score alone caused it)
 *  2. motor_active=true  AND avg hazard <  75  → spike trigger (avg masked a peak)
 *  3. motor_active=false AND hazard >= 50      → warning, fan did NOT fire
 *  4. motor_active=false AND hazard <  50      → all clear
 */
function classifyRow(hazard: number, motorActive: boolean) {
  if (motorActive && hazard >= 75) {
    return {
      label: 'Exhaust Triggered',
      cls: 'badge-red',
      scoreColor: 'var(--red)',
      note: null,
    };
  }
  if (motorActive && hazard < 75) {
    return {
      label: 'Fan Active (spike)',
      cls: 'badge-red',
      scoreColor: 'var(--amber)',
      // Explain the apparent mismatch to the user
      note: 'Window avg shown — a momentary spike >75 triggered the fan within this 2-min window',
    };
  }
  if (!motorActive && hazard >= 50) {
    return {
      label: 'Alert Raised',
      cls: 'badge-amber',
      scoreColor: 'var(--amber)',
      note: null,
    };
  }
  return {
    label: 'System Normal',
    cls: 'badge-green',
    scoreColor: 'var(--green)',
    note: null,
  };
}

export default function XaiTable({ history }: XaiTableProps) {
  const rows = history.slice(0, 30);

  return (
    <div className="card" style={{ padding: '18px 0 0' }}>
      <div className="section-title" style={{ padding: '0 18px 12px' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
        </svg>
        Explainability Log (XAI)
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>
          {rows.length > 0 ? `${rows.length} events` : 'No data yet'} · Last 30 · 2-min avg rows
        </span>
      </div>
      <div className="xai-table-wrap">
        <table id="xai-table">
          <thead>
            <tr>
              <th style={{ width: 75 }}>Timestamp</th>
              <th style={{ width: 130 }}>Action</th>
              <th style={{ width: 75 }}>Avg Score</th>
              <th>XAI Breakdown</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const uniqueKey = `${row.created_at}-${i}`;
              const cfg = classifyRow(row.hazard_score, row.motor_active);
              const { gasFactor, tempMultiplier, occupancyPenalty } = getXaiBreakdown(
                row.temperature, row.gas, row.light
              );

              return (
                <tr key={uniqueKey} className="fade-in">
                  <td>{formatTime(row.created_at)}</td>
                  <td><span className={`action-badge ${cfg.cls}`}>{cfg.label}</span></td>
                  <td>
                    <span className="score-cell" style={{ color: cfg.scoreColor }}>
                      {row.hazard_score}/100
                    </span>
                  </td>
                  <td className="xai-breakdown">
                    Gas Factor: {gasFactor} × Temp Mult: {tempMultiplier} + Occ Penalty: {occupancyPenalty}
                    {cfg.note && (
                      <div style={{ marginTop: 3, fontSize: 10.5, color: 'var(--amber)', fontStyle: 'italic' }}>
                        ⚡ {cfg.note}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '24px 0' }}>
                  Waiting for first telemetry packet…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
