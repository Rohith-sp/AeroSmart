'use client';
import { calculateMotorHealth, getHealthColor } from '@/lib/calculations';

interface MotorHealthCardProps {
  power: number;
}

export default function MotorHealthCard({ power }: MotorHealthCardProps) {
  const health = calculateMotorHealth(power);
  const { color, bg, chip, label } = getHealthColor(health);

  return (
    <div className="card metric-card">
      <div className="metric-header">
        <div className="metric-label">Motor Health Index</div>
        <div className="metric-icon" style={{ background: 'var(--green-lt)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
      </div>
      <div className="hazard-score-row">
        <div className="hazard-score-num" style={{ color }}>{health}</div>
        <div className="hazard-score-denom">%</div>
      </div>
      <div className="hazard-bar-track">
        <div className="hazard-bar-fill" style={{ width: `${health}%`, background: bg }} />
      </div>
      <div className={`metric-chip ${chip}`}>⬤ {label}</div>
      <hr className="metric-divider" />
      <div className="metric-footer">100 − ((Power − 4.5W) / 4.5W × 100)</div>
    </div>
  );
}
