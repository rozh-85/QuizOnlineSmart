import { useState, useEffect } from 'react';
import { 
  Plus, 
  User, 
  Smartphone, 
  ShieldCheck,
  Users,
  Trash2,
  Unlock,
} from 'lucide-react';
import { studentService, classService } from '../../services/supabaseService';
import toast from 'react-hot-toast';
import { Select, PageHeader, SearchInput, StatCard, DataTable, ConfirmDialog } from '../../components/ui';
import {
  CreateStudentModal,
  StudentSuccessModal,
  StudentInfoModal,
  AssignClassModal,
  ChangePasswordModal,
  StudentTableRow,
} from '../../components/student-manager';

const StudentManager = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'locked' | 'unlocked'>('all');

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isViewInfoOpen, setIsViewInfoOpen] = useState(false);

  const [createdStudentInfo, setCreatedStudentInfo] = useState<any>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<any>(null);
  const [isResetDeviceOpen, setIsResetDeviceOpen] = useState(false);
  const [studentToReset, setStudentToReset] = useState<any>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [studentToChangePassword, setStudentToChangePassword] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [selectedClassId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const classData = await classService.getAll();
      setClasses(classData);

      let studentData;
      if (selectedClassId === 'all') {
        studentData = await studentService.getAll();
      } else {
        studentData = await classService.getClassStudents(selectedClassId);
      }
      setStudents(studentData);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (data: { fullName: string; serialId: string; pin: string; classId: string }) => {
    if (!data.fullName || !data.serialId || !data.pin) {
      toast.error('Required fields missing');
      return;
    }
    try {
      const signUpResult = await studentService.createStudent(data.fullName, data.serialId, data.pin);
      const studentId = (signUpResult as any).user?.id || (signUpResult as any).id;
      if (data.classId && studentId) {
        await classService.addStudentToClass(data.classId, studentId);
      }
      setCreatedStudentInfo({ fullName: data.fullName, serialId: data.serialId, pin: data.pin });
      setIsModalOpen(false);
      setIsSuccessModalOpen(true);
      fetchData();
    } catch (error: any) {
      console.error('Creation failed:', error);
      if (error.message?.includes('rate limit')) {
        toast.error('Supabase Rate Limit! Go to Dashboard > Auth > Settings > Rate Limits and increase the Signups limit.', { duration: 6000 });
      } else {
        toast.error(error.message || 'Creation failed');
      }
      throw error;
    }
  };

  const confirmResetDevice = async () => {
    if (!studentToReset) return;
    try {
      setLoading(true);
      setIsResetDeviceOpen(false);
      await studentService.resetDeviceLock(studentToReset.id);
      toast.success('Device lock reset successfully');
      setStudentToReset(null);
      fetchData();
    } catch (error) {
      console.error('Reset device error:', error);
      toast.error('Failed to reset device lock');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (studentId: string, newPassword: string) => {
    if (!newPassword) { toast.error('Please enter a new password'); return; }
    if (newPassword.length < 4) { toast.error('Password must be at least 4 characters'); return; }
    try {
      await studentService.changeStudentPassword(studentId, newPassword);
      toast.success(`Password updated for ${studentToChangePassword?.full_name}`);
      setIsPasswordModalOpen(false);
      setStudentToChangePassword(null);
      fetchData();
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.message || 'Failed to change password');
      throw error;
    }
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      setLoading(true);
      setIsDeleteConfirmOpen(false);
      await studentService.deleteStudent(studentToDelete.id);
      toast.success('Student deleted successfully');
      setStudentToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete student');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToClass = async (classId: string) => {
    if (!selectedStudent) return;
    try {
      await classService.addStudentToClass(classId, selectedStudent.id);
      toast.success('Enrolled');
      setIsAssignModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.code === '23505' ? 'Already enrolled' : 'Failed to enroll');
    }
  };

  const handleRemoveFromClass = async (studentId: string) => {
    if (selectedClassId === 'all') return;
    if (!window.confirm('Remove student from this class?')) return;
    try {
      setLoading(true);
      await classService.removeStudentFromClass(selectedClassId, studentId);
      toast.success('Removed from class');
      fetchData();
    } catch (error) {
      toast.error('Failed to remove');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.serial_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDevice = deviceFilter === 'all' 
      ? true 
      : deviceFilter === 'locked' ? s.device_lock_active : !s.device_lock_active;
    return matchesSearch && matchesDevice;
  });

  return (
    <div className="animate-fade-in w-full">
      <PageHeader
        title="Students."
        badge="Directory"
        subtitle="Manage student accounts and access control"
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-primary-200 transition-all active:scale-95 text-sm"
          >
            <Plus size={18} />
            New Student
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput containerClassName="flex-1 max-w-sm" placeholder="Search students..." value={searchQuery} onChange={setSearchQuery} />
        <Select containerClassName="flex-1 max-w-xs" icon={<Users size={16} />} value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
          <option value="all">All Students</option>
          {classes.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </Select>
        <Select containerClassName="flex-1 max-w-[180px]" icon={<Smartphone size={16} />} value={deviceFilter} onChange={(e) => setDeviceFilter(e.target.value as any)}>
          <option value="all">All Devices</option>
          <option value="locked">Locked Only</option>
          <option value="unlocked">Unlocked Only</option>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={<User size={14} className="text-blue-500" />} value={students.length} label={selectedClassId === 'all' ? 'Total Students' : 'In Class'} color="bg-blue-50" />
        <StatCard icon={<Smartphone size={14} className="text-rose-500" />} value={students.filter(s => s.device_lock_active).length} label="Locked Devices" color="bg-rose-50" />
        <StatCard icon={<ShieldCheck size={14} className="text-emerald-500" />} value={classes.length} label="Classes" color="bg-emerald-50" />
      </div>

      <DataTable
        columns={[
          { label: 'Student' },
          { label: 'Serial ID', align: 'center' },
          { label: 'Device', align: 'center' },
          { label: 'Actions', align: 'right' },
        ]}
        loading={loading && students.length === 0}
        isEmpty={filteredStudents.length === 0}
        emptyIcon={<Users size={28} />}
        emptyText="No students found"
        skeletonRows={4}
      >
        {filteredStudents.map((s) => (
          <StudentTableRow
            key={s.id}
            student={s}
            selectedClassId={selectedClassId}
            onViewInfo={(st) => { setSelectedStudent(st); setIsViewInfoOpen(true); }}
            onAssignClass={(st) => { setSelectedStudent(st); setIsAssignModalOpen(true); }}
            onChangePassword={(st) => { setStudentToChangePassword(st); setIsPasswordModalOpen(true); }}
            onDelete={(st) => { setStudentToDelete(st); setIsDeleteConfirmOpen(true); }}
            onResetDevice={(st) => { setStudentToReset(st); setIsResetDeviceOpen(true); }}
            onRemoveFromClass={handleRemoveFromClass}
          />
        ))}
      </DataTable>

      {isModalOpen && (
        <CreateStudentModal classes={classes} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateStudent} />
      )}

      {isSuccessModalOpen && createdStudentInfo && (
        <StudentSuccessModal studentInfo={createdStudentInfo} onClose={() => setIsSuccessModalOpen(false)} />
      )}

      {isViewInfoOpen && selectedStudent && (
        <StudentInfoModal student={selectedStudent} onClose={() => setIsViewInfoOpen(false)} />
      )}

      {isAssignModalOpen && selectedStudent && (
        <AssignClassModal student={selectedStudent} classes={classes} onAssign={handleAssignToClass} onClose={() => setIsAssignModalOpen(false)} />
      )}

      {isPasswordModalOpen && studentToChangePassword && (
        <ChangePasswordModal student={studentToChangePassword} onClose={() => { setIsPasswordModalOpen(false); setStudentToChangePassword(null); }} onSubmit={handleChangePassword} />
      )}

      <ConfirmDialog
        open={isResetDeviceOpen && !!studentToReset}
        onClose={() => { setIsResetDeviceOpen(false); setStudentToReset(null); }}
        onConfirm={confirmResetDevice}
        icon={<Unlock size={32} />}
        iconBg="bg-amber-50 text-amber-600"
        title="Reset Device Lock?"
        message={<>This will unlock the device for <span className="text-slate-900 font-black">{studentToReset?.full_name}</span> and allow them to log in from a different device.</>}
        confirmLabel="Yes, Reset Lock"
        confirmColor="amber"
      />

      <ConfirmDialog
        open={isDeleteConfirmOpen && !!studentToDelete}
        onClose={() => { setIsDeleteConfirmOpen(false); setStudentToDelete(null); }}
        onConfirm={confirmDelete}
        icon={<Trash2 size={32} />}
        iconBg="bg-rose-50 text-rose-500"
        title="Are you sure?"
        message={<>You are about to delete <span className="text-slate-900 font-black">{studentToDelete?.full_name}</span>. This action cannot be undone and all data will be lost.</>}
        confirmLabel="Yes, Delete Student"
        cancelLabel="No, Keep it"
        confirmColor="rose"
      />
    </div>
  );
};

export default StudentManager;
