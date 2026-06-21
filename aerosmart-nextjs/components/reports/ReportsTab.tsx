'use client';
import { useState } from 'react';
import { TelemetryRow } from '@/lib/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsTabProps {
  history: TelemetryRow[];
}

export default function ReportsTab({ history }: ReportsTabProps) {
  const [generating, setGenerating] = useState(false);

  const generatePDF = () => {
    setGenerating(true);
    
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        const dateStr = new Date().toLocaleDateString();
        
        // --- Header ---
        doc.setFontSize(22);
        doc.setTextColor(0, 0, 0);
        doc.text('AeroSmart Compliance Report', 14, 22);
        
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        doc.text('Confidential Industrial Environmental Log', 14, 36);

        // --- Summary Stats ---
        if (history.length > 0) {
          const avgHazard = history.reduce((sum, r) => sum + r.hazard_score, 0) / history.length;
          const peakGas = Math.max(...history.map(r => r.gas));
          const minHealth = Math.min(...history.map(r => (100 - Math.abs(((r.power - 4.5) / 4.5) * 100))));
          
          doc.setFontSize(14);
          doc.setTextColor(0, 0, 0);
          doc.text('Executive Summary', 14, 50);
          
          doc.setFontSize(11);
          doc.text(`Total Records Logged: ${history.length}`, 14, 58);
          doc.text(`Average Hazard Score: ${avgHazard.toFixed(1)} / 100`, 14, 64);
          doc.text(`Peak Gas Level: ${peakGas.toFixed(0)} ppm`, 14, 70);
          doc.text(`Minimum Motor Health: ${Math.max(0, minHealth).toFixed(1)}%`, 14, 76);
        } else {
          doc.setTextColor(0, 0, 0);
          doc.text('No data available for this period.', 14, 50);
        }

        // --- Table Data ---
        if (history.length > 0) {
          doc.setTextColor(0, 0, 0);
          doc.text('Raw Telemetry Logs (Last 50 Entries)', 14, 90);
          
          const tableData = history.slice(-50).reverse().map(r => [
            new Date(r.created_at).toLocaleTimeString(),
            r.hazard_score.toFixed(1),
            r.gas.toFixed(0),
            `${r.temperature.toFixed(1)}C`,
            r.light > 400 ? 'Yes' : 'No',
            r.motor_active ? 'ON' : 'OFF',
            `${r.power.toFixed(2)}W`
          ]);

          autoTable(doc, {
            startY: 95,
            head: [['Time', 'Hazard', 'Gas', 'Temp', 'Occupied', 'Fan', 'Motor Pwr']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255] },
            styles: { textColor: [0, 0, 0] }
          });
        }

        doc.save(`AeroSmart_Compliance_Report_${dateStr.replace(/\//g, '-')}.pdf`);
      } catch (err) {
        console.error("PDF Generation failed:", err);
        alert("Failed to generate PDF. Make sure you have some data!");
      } finally {
        setGenerating(false);
      }
    }, 500); // slight delay to show loading state
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ marginBottom: 10, color: 'var(--text)' }}>Compliance Reporting</h2>
        <p style={{ color: 'var(--text)', marginBottom: 20, fontSize: '1.05rem', lineHeight: 1.6 }}>
          Generate formal, time-stamped PDF reports containing an executive summary of your ventilation performance and raw telemetry data logs for safety audits.
        </p>

        <button 
          onClick={generatePDF} 
          disabled={generating || history.length === 0}
          style={{
            background: 'var(--green)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 'var(--radius-sm)',
            cursor: generating ? 'not-allowed' : 'pointer',
            opacity: generating ? 0.7 : 1,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {generating ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 2s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Generating PDF...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Download PDF Report
            </>
          )}
        </button>
      </div>
    </div>
  );
}
