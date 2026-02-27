import { useState, useEffect, useRef } from 'react';

// =====================================================
// Timer hook (for attendance session elapsed time)
// =====================================================

export const useTimer = (isActive: boolean, startedAt: Date | null) => {
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive && startedAt) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, startedAt]);

  const reset = () => {
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return { elapsed, reset, timerRef };
};
