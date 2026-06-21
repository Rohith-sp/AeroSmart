'use client';
import { getDeviationPct, BASELINE_POWER } from '@/lib/calculations';

interface MotorPowerCardProps {
  voltage: number;
  current: number;
  power: number;
}

export default function MotorPowerCard({ voltage, current, power }: MotorPowerCardProps) {
  const pct = getDeviationPct(power);
  const chipClass = Math.abs(pct) < 10 ? 'chip-green' : Math.abs(pct) < 25 ? 'chip-amber' : 'chip-red';

  return (
    <div className="card metric-card">
      <div className="metric-header">
        <div className="metric-label">Motor Power</div>
        <div className="metric-icon" style={{ background: 'var(--purple-lt)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
          </svg>
        </div>
      </div>
      <div className="metric-value" style={{ color: 'var(--purple)' }}>{power.toFixed(2)} W</div>
      <div className="metric-sub">{voltage.toFixed(2)}V × {current.toFixed(3)}A · DC Exhaust Fan</div>
      <div className={`metric-chip ${chipClass}`}>
        {pct >= 0 ? '+' : ''}{pct.toFixed(1)}% vs Baseline
      </div>
      <hr className="metric-divider" />
      <div className="metric-footer">Healthy baseline: {BASELINE_POWER}W @ 9V / 0.5A</div>
    </div>
  );
}
