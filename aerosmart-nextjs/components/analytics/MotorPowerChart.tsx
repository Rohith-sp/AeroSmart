'use client';
import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { TelemetryRow } from '@/lib/types';
import { TimeFilter } from '@/lib/types';
import { BASELINE_POWER } from '@/lib/calculations';

Chart.register(...registerables);

const CHART_GRID       = '#EEF0F5';
const CHART_TICK       = '#8E96A8';
const CHART_BORDER     = '#E4E7EE';
const CHART_TOOLTIP_BG = '#1A1D23';

interface Props {
  history: TelemetryRow[];
  filter: TimeFilter;
}

function filterRows(rows: TelemetryRow[], filter: TimeFilter): TelemetryRow[] {
  const now = Date.now();
  const ms = filter === '1h' ? 3_600_000 : filter === '24h' ? 86_400_000 : 604_800_000;
  const filtered = [...rows].filter(r => now - new Date(r.created_at).getTime() <= ms).reverse();
  return filtered.length >= 2 ? filtered : [...rows].reverse();
}

export default function MotorPowerChart({ history, filter }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const rows     = filterRows(history, filter);
    const labels   = rows.map(r => new Date(r.created_at).toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    const power    = rows.map(r => r.power);
    const voltage  = rows.map(r => r.voltage);
    const baseline = Array(rows.length).fill(BASELINE_POWER);

    if (chartRef.current) {
      chartRef.current.data.labels = labels;
      chartRef.current.data.datasets[0].data = power;
      chartRef.current.data.datasets[1].data = baseline;
      chartRef.current.data.datasets[2].data = voltage;
      chartRef.current.update();
      return;
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Motor Power (W)', data: power, borderColor: '#6B4FBB', backgroundColor: 'rgba(107,79,187,0.06)', borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#6B4FBB', tension: 0.4, fill: true, yAxisID: 'y' },
          { label: 'Healthy Baseline 4.5W', data: baseline, borderColor: '#C0392B', borderWidth: 1.5, borderDash: [6, 4], pointRadius: 0, fill: false, yAxisID: 'y' },
          { label: 'Voltage (V)', data: voltage, borderColor: '#3aaee0', borderWidth: 1.5, pointRadius: 0, tension: 0.4, fill: false, yAxisID: 'y2' },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: CHART_TOOLTIP_BG,
            titleFont: { family: 'Inter', size: 11 },
            bodyFont: { family: 'Inter', size: 12 },
            padding: 10, cornerRadius: 6,
            callbacks: { label: (ctx) => ctx.dataset.label + ': ' + ctx.raw + (ctx.datasetIndex === 2 ? 'V' : 'W') },
          },
        },
        scales: {
          x: { grid: { color: CHART_GRID }, ticks: { color: CHART_TICK, font: { family: 'Inter', size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 }, border: { color: CHART_BORDER } },
          y: { grid: { color: CHART_GRID }, ticks: { color: '#6B4FBB', font: { family: 'Inter', size: 10 }, callback: (v) => (v as number).toFixed(1) + ' W' }, border: { color: CHART_BORDER } },
          y2: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#3aaee0', font: { family: 'Inter', size: 10 }, callback: (v) => (v as number).toFixed(1) + 'V' }, border: { color: 'transparent' } },
        },
      },
    });

    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, filter]);

  return (
    <div className="card chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Motor Power Signature &amp; Voltage Stability</div>
          <div className="chart-subtitle">DC Exhaust Fan · Real telemetry · Dashed line = 4.5W baseline</div>
        </div>
        <div className="chart-legend">
          <div className="legend-item"><div className="legend-dot" style={{ background: '#6B4FBB' }} />Power (W)</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: '#3aaee0' }} />Voltage (V)</div>
          <div className="legend-item" style={{ color: 'var(--text-muted)' }}>
            <span style={{ fontSize: 11, display: 'inline-block', width: 14, borderTop: '2px dashed #C0392B', marginBottom: 2, marginRight: 3 }} />Baseline
          </div>
        </div>
      </div>
      <div className="chart-wrap" style={{ height: 240 }}>
        <canvas ref={canvasRef} aria-label="Motor power and voltage chart with baseline overlay" />
      </div>
    </div>
  );
}
