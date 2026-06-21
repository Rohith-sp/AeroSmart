'use client';
import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { TelemetryRow } from '@/lib/types';
import { TimeFilter } from '@/lib/types';

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
  const filtered = [...rows]
    .filter(r => now - new Date(r.created_at).getTime() <= ms)
    .reverse(); // ascending order for chart
  return filtered.length >= 2 ? filtered : [...rows].reverse(); // fallback to all
}

export default function CorrelationChart({ history, filter }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const rows   = filterRows(history, filter);
    const labels = rows.map(r => new Date(r.created_at).toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    const gas    = rows.map(r => r.gas);
    const temp   = rows.map(r => r.temperature);

    if (chartRef.current) {
      chartRef.current.data.labels = labels;
      chartRef.current.data.datasets[0].data = gas;
      chartRef.current.data.datasets[1].data = temp;
      chartRef.current.update();
      return;
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Gas PPM', data: gas, borderColor: '#4F6EF7', backgroundColor: 'rgba(79,110,247,0.05)', borderWidth: 2, pointRadius: 3.5, pointBackgroundColor: '#4F6EF7', tension: 0.4, fill: true, yAxisID: 'y' },
          { label: 'Temp °C', data: temp, borderColor: '#E8895A', borderWidth: 2, pointRadius: 3.5, pointBackgroundColor: '#E8895A', tension: 0.4, fill: false, borderDash: [5, 3], yAxisID: 'y2' },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: CHART_TOOLTIP_BG, titleFont: { family: 'Inter', size: 11 }, bodyFont: { family: 'Inter', size: 12 }, padding: 10, cornerRadius: 6 },
        },
        scales: {
          x: { grid: { color: CHART_GRID }, ticks: { color: CHART_TICK, font: { family: 'Inter', size: 10 }, maxRotation: 30, autoSkip: true, maxTicksLimit: 10 }, border: { color: CHART_BORDER } },
          y: { position: 'left', grid: { color: CHART_GRID }, ticks: { color: '#4F6EF7', font: { family: 'Inter', size: 10 }, callback: (v) => v + ' ppm' }, border: { color: CHART_BORDER } },
          y2: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#E8895A', font: { family: 'Inter', size: 10 }, callback: (v) => v + '°C' }, border: { color: 'transparent' } },
        },
      },
    });

    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, filter]);

  return (
    <div className="card chart-card" style={{ marginBottom: 14 }}>
      <div className="chart-header">
        <div>
          <div className="chart-title">Environmental Correlation — Gas PPM vs Temperature (°C)</div>
          <div className="chart-subtitle">Dual-axis · Sampled every 2 minutes · From Supabase telemetry</div>
        </div>
        <div className="chart-legend">
          <div className="legend-item"><div className="legend-dot" style={{ background: '#4F6EF7' }} />Gas PPM (left)</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: '#E8895A' }} />Temp °C (right)</div>
        </div>
      </div>
      <div className="chart-wrap" style={{ height: 250 }}>
        <canvas ref={canvasRef} aria-label="Dual axis correlation chart for gas and temperature" />
      </div>
    </div>
  );
}
