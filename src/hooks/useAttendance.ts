import { useState, useEffect, useRef, useCallback } from 'react';
import { attendanceApi } from '../api/attendanceApi';
import { subscribeToAttendanceRecords } from '../services/realtimeService';
import { ATTENDANCE_POLL_INTERVAL_MS, QR_REFRESH_INTERVAL_MS } from '../constants/app';

// =====================================================
// Attendance session hook
// =====================================================

export type SessionStatus = 'idle' | 'pending' | 'active' | 'completed';

export const useAttendanceSession = (sessionId: string | null, sessionStatus: SessionStatus) => {
  const [records, setRecords] = useState<any[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (sessionStatus === 'active' && sessionId) {
      const fetchRecords = async () => {
        try {
          const data = await attendanceApi.getSessionRecords(sessionId);
          setRecords(data);
        } catch (e) {
          console.error('Failed to fetch records:', e);
        }
      };
      fetchRecords();
      pollRef.current = setInterval(fetchRecords, ATTENDANCE_POLL_INTERVAL_MS);

      const channel = subscribeToAttendanceRecords(sessionId, () => {
        fetchRecords();
      });

      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
        channel.unsubscribe();
      };
    }
  }, [sessionStatus, sessionId]);

  return { records, setRecords };
};

export const useQrTokenRefresh = (sessionId: string | null, sessionStatus: SessionStatus, qrVisible: boolean) => {
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const qrIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshQrToken = useCallback(async () => {
    if (!sessionId) return;
    try {
      await attendanceApi.deactivateSessionTokens(sessionId);
      const tokenData = await attendanceApi.createToken(sessionId);
      setCurrentToken(tokenData.token);
    } catch (e) {
      console.error('Failed to refresh QR token:', e);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionStatus === 'active' && qrVisible && sessionId) {
      refreshQrToken();
      qrIntervalRef.current = setInterval(refreshQrToken, QR_REFRESH_INTERVAL_MS);
    } else {
      if (qrIntervalRef.current) {
        clearInterval(qrIntervalRef.current);
        qrIntervalRef.current = null;
      }
      if (sessionId && sessionStatus === 'active' && !qrVisible) {
        attendanceApi.deactivateSessionTokens(sessionId);
        setCurrentToken(null);
      }
    }
    return () => {
      if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
    };
  }, [sessionStatus, qrVisible, sessionId, refreshQrToken]);

  return { currentToken, setCurrentToken };
};
