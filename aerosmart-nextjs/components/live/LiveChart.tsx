'use client';
import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { TelemetryRow } from '@/lib/types';

Chart.register(...registerables);

const CHART_GRID       = '#EEF0F5';
const CHART_TICK       = '#8E96A8';
const CHART_BORDER     = '#E4E7EE';
const CHART_TOOLTIP_BG = '#1A1D23';

interface LiveChartProps {
  history: TelemetryRow[]; // descending order (newest first)
}

export default function LiveChart({ history }: LiveChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);

  // Build display slice (last 30 rows, ascending for left→right time)
  const rows = [...history].reverse().slice(-30);

  useEffect(() => {
    if (!canvasRef.current) return;

    const labels   = rows.map(r => new Date(r.created_at).toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    const gasData  = rows.map(r => r.gas);
    const tempData = rows.map(r => r.temperature);

    if (chartRef.current) {
      // Live update — mutate existing chart data
      chartRef.current.data.labels = labels;
      chartRef.current.data.datasets[0].data = gasData;
      chartRef.current.data.datasets[1].data = tempData;
      chartRef.current.update('active');
      return;
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Gas (PPM)',
            data: gasData,
            borderColor: '#4F6EF7',
            backgroundColor: 'rgba(79,110,247,0.06)',
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.35,
            fill: true,
            yAxisID: 'y',
          },
          {
            label: 'Temp (°C)',
            data: tempData,
            borderColor: '#E8895A',
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.35,
            fill: false,
            borderDash: [4, 3],
            yAxisID: 'y2',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: CHART_TOOLTIP_BG,
            titleFont: { family: 'Inter', size: 11 },
            bodyFont: { family: 'Inter', size: 12 },
            padding: 10,
            cornerRadius: 6,
          },
        },
        scales: {
          x: {
            grid: { color: CHART_GRID },
            ticks: { color: CHART_TICK, font: { family: 'Inter', size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
            border: { color: CHART_BORDER },
          },
          y: {
            position: 'left',
            grid: { color: CHART_GRID },
            ticks: { color: '#4F6EF7', font: { family: 'Inter', size: 10 }, callback: (v) => v + ' ppm' },
            border: { color: CHART_BORDER },
          },
          y2: {
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#E8895A', font: { family: 'Inter', size: 10 }, callback: (v) => v + '°C' },
            border: { color: 'transparent' },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  return (
    <div className="card chart-card" style={{ marginBottom: 14 }}>
      <div className="chart-header">
        <div>
          <div className="chart-title">Live Telemetry — Gas PPM &amp; Temperature</div>
          <div className="chart-subtitle">Real-time · Last 30 data points · Updates every 2s</div>
        </div>
        <div className="chart-legend">
          <div className="legend-item"><div className="legend-dot" style={{ background: '#4F6EF7' }} />Gas (PPM)</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: '#E8895A' }} />Temp (°C)</div>
        </div>
      </div>
      <div className="chart-wrap">
        <canvas ref={canvasRef} aria-label="Live telemetry line chart showing gas PPM and temperature" />
      </div>
    </div>
  );
}
