import { useState, useEffect, ReactNode } from 'react';
import StudentLayout from './StudentLayout';
import { authService, lectureQAService } from '../services/supabaseService';
import { supabase } from '../lib/supabase';

interface Props {
  children: ReactNode;
}

const StudentLayoutWrapper = ({ children }: Props) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let sub: any = null;

    const init = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user) return;

        // Initial fetch
        const count = await lectureQAService.getStudentUnreadCount(user.id);
        setUnreadCount(count);

        // Subscribe to real-time
        sub = supabase
          .channel('layout-notif-' + user.id)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'lecture_questions',
            filter: `student_id=eq.${user.id}`
          }, async () => {
            const c = await lectureQAService.getStudentUnreadCount(user.id);
            setUnreadCount(c);
          })
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'lecture_question_messages'
          }, async () => {
            const c = await lectureQAService.getStudentUnreadCount(user.id);
            setUnreadCount(c);
          })
          .subscribe();
      } catch (e) {
        console.error('Layout notif init error:', e);
      }
    };

    init();

    // Listen for manual count changes (e.g. when student reads a thread)
    const handleCountChange = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          const c = await lectureQAService.getStudentUnreadCount(user.id);
          setUnreadCount(c);
        }
      } catch { /* ignore */ }
    };
    window.addEventListener('unread-count-changed', handleCountChange);

    return () => {
      window.removeEventListener('unread-count-changed', handleCountChange);
      if (sub) sub.unsubscribe();
    };
  }, []);

  return (
    <StudentLayout unreadCount={unreadCount}>
      {children}
    </StudentLayout>
  );
};

export default StudentLayoutWrapper;
