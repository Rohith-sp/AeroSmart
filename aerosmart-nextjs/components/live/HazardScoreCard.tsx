'use client';
import { getHazardColor } from '@/lib/calculations';

interface HazardScoreCardProps {
  score: number;
}

export default function HazardScoreCard({ score }: HazardScoreCardProps) {
  const { color, bg, chip, label } = getHazardColor(score);

  return (
    <div className="card metric-card">
      <div className="metric-header">
        <div className="metric-label">Composite Hazard Score</div>
        <div className="metric-icon" style={{ background: 'var(--accent-lt)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
      </div>
      <div className="hazard-score-row">
        <div className="hazard-score-num" style={{ color }}>{score}</div>
        <div className="hazard-score-denom">/ 100</div>
      </div>
      <div className="hazard-bar-track">
        <div className="hazard-bar-fill" style={{ width: `${score}%`, background: bg }} />
      </div>
      <div className={`metric-chip ${chip}`}>⬤ {label}</div>
      <hr className="metric-divider" />
      <div className="metric-footer">Fan triggers at score ≥ 75 · Updated every 2s</div>
    </div>
  );
}
