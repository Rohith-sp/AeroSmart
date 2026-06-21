import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AeroSmart XAI — Intelligent Ventilation Monitor',
  description: 'AeroSmart XAI: Real-time autonomous ventilation and industrial air quality monitoring with explainable AI diagnostics.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
