import { ReactNode } from 'react';
import StudentLayout from './StudentLayout';
import { useStudentUnreadCount } from '../hooks/useUnreadCount';

interface Props {
  children: ReactNode;
}

const StudentLayoutWrapper = ({ children }: Props) => {
  const { unreadCount } = useStudentUnreadCount();

  return (
    <StudentLayout unreadCount={unreadCount}>
      {children}
    </StudentLayout>
  );
};

export default StudentLayoutWrapper;
