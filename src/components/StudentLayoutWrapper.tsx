import { ReactNode } from 'react';
import StudentLayout from './StudentLayout';
import { useStudentUnreadCount, useWhatsNewUnreadCount } from '../hooks/useUnreadCount';

interface Props {
  children: ReactNode;
}

const StudentLayoutWrapper = ({ children }: Props) => {
  const { unreadCount } = useStudentUnreadCount();
  const { unreadNewsCount } = useWhatsNewUnreadCount();

  return (
    <StudentLayout unreadCount={unreadCount} unreadNewsCount={unreadNewsCount}>
      {children}
    </StudentLayout>
  );
};

export default StudentLayoutWrapper;
