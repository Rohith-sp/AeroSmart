'use client';
import { useState, useEffect } from 'react';

export function useClock() {
  const [time, setTime]     = useState('--:--:--');
  const [uptime, setUptime] = useState('0h 0m');
  const [fanCount, setFanCount] = useState(3);
  const startRef = typeof window !== 'undefined' ? Date.now() : 0;

  useEffect(() => {
    const start = Date.now();

    function tick() {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      setTime(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);

      const elapsed = Math.floor((Date.now() - start) / 1000);
      const uh = Math.floor(elapsed / 3600);
      const um = Math.floor((elapsed % 3600) / 60);
      setUptime(`${uh}h ${um}m`);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return { time, uptime, fanCount };
}
