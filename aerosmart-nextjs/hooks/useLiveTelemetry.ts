'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { TelemetryRow } from '@/lib/types';
import { getMockTelemetry, generateLatestMockRow } from '@/lib/mockData';

// ── Toggle this one env var when hardware goes live ───────────────────────
const USE_REAL_DATA = process.env.NEXT_PUBLIC_USE_REAL_DATA === 'true';

interface UseLiveTelemetryReturn {
  latest: TelemetryRow | null;
  history: TelemetryRow[];      // last 60 rows, descending timestamp
  isConnected: boolean;
  fanTriggerCount: number;
  totalFanOnSeconds: number;
}

export function useLiveTelemetry(): UseLiveTelemetryReturn {
  const [latest, setLatest]         = useState<TelemetryRow | null>(null);
  const [history, setHistory]       = useState<TelemetryRow[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [fanTriggerCount, setFanTriggerCount] = useState(3);
  const [totalFanOnSeconds, setTotalFanOnSeconds] = useState(122);
  const fanOnSecondsRef = useRef(122);

  // ── MOCK MODE ──────────────────────────────────────────────────────────
  const runMockMode = useCallback(() => {
    // Seed with stable historical data
    const initial = getMockTelemetry(60);
    setHistory(initial);
    setLatest(initial[0]);
    setIsConnected(true);
    setFanTriggerCount(initial.filter(r => r.motor_active).length);

    // Simulate new readings arriving every 2s (like real ESP32 → brain.py → Supabase)
    const id = setInterval(() => {
      const newRow = generateLatestMockRow();
      setLatest(newRow);
      setHistory(prev => [newRow, ...prev].slice(0, 60));

      if (newRow.motor_active) {
        setFanTriggerCount(c => c + 1);
      }

      fanOnSecondsRef.current += 2;
      setTotalFanOnSeconds(fanOnSecondsRef.current);
    }, 2000);

    return () => clearInterval(id);
  }, []);

  // ── REAL MODE (Supabase) ───────────────────────────────────────────────
  // HARDWARE SWAP: Uncomment and use when brain.py is live.
  // The Realtime subscription fires on every INSERT (every ~2 min flush).
  const runRealMode = useCallback(async () => {
    const { supabase } = await import('@/lib/supabase');

    // Initial load
    const { data } = await supabase
      .from('telemetry')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60);

    if (data && data.length > 0) {
      setHistory(data as TelemetryRow[]);
      setLatest(data[0] as TelemetryRow);
      setIsConnected(true);
      setFanTriggerCount(data.filter((r: TelemetryRow) => r.motor_active).length);
    }

    // Realtime subscription for new INSERTs
    const channel = supabase
      .channel('telemetry-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'telemetry' },
        (payload) => {
          const newRow = payload.new as TelemetryRow;
          setLatest(newRow);
          setHistory(prev => [newRow, ...prev].slice(0, 60));
          if (newRow.motor_active) setFanTriggerCount(c => c + 1);
          fanOnSecondsRef.current += 120; // each flush = 2 min window
          setTotalFanOnSeconds(fanOnSecondsRef.current);
        }
      )
      .subscribe();

    // Polling fallback every 5s for resilience
    const pollId = setInterval(async () => {
      const { data: polled } = await supabase
        .from('telemetry')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      if (polled && polled[0]) {
        const row = polled[0] as TelemetryRow;
        setLatest(prev => {
          if (!prev || row.id !== prev.id) {
            setHistory(h => [row, ...h].slice(0, 60));
            return row;
          }
          return prev;
        });
        setIsConnected(true);
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollId);
    };
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (USE_REAL_DATA) {
      runRealMode().then(fn => { cleanup = fn; });
    } else {
      cleanup = runMockMode();
    }

    return () => cleanup?.();
  }, [runMockMode, runRealMode]);

  return { latest, history, isConnected, fanTriggerCount, totalFanOnSeconds };
}
