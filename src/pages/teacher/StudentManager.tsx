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
import { useTranslation } from 'react-i18next';
import { studentApi } from '../../api/studentApi';
import { classApi } from '../../api/classApi';
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
  const { t } = useTranslation();
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
      const classData = await classApi.getAll();
      setClasses(classData);

      let studentData;
      if (selectedClassId === 'all') {
        studentData = await studentApi.getAll();
      } else {
        studentData = await classApi.getClassStudents(selectedClassId);
      }
      setStudents(studentData);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error(t('studentManager.failedToLoadData'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (data: { fullName: string; serialId: string; pin: string; classId: string }) => {
    if (!data.fullName || !data.serialId || !data.pin) {
      toast.error(t('studentManager.requiredFieldsMissing'));
      return;
    }
    try {
      const signUpResult = await studentApi.createStudent(data.fullName, data.serialId, data.pin);
      const studentId = (signUpResult as any).user?.id || (signUpResult as any).id;
      if (data.classId && studentId) {
        await classApi.addStudentToClass(data.classId, studentId);
      }
      setCreatedStudentInfo({ fullName: data.fullName, serialId: data.serialId, pin: data.pin });
      setIsModalOpen(false);
      setIsSuccessModalOpen(true);
      fetchData();
    } catch (error: any) {
      console.error('Creation failed:', error);
      if (error.message?.includes('rate limit')) {
        toast.error(t('studentManager.rateLimitError'), { duration: 6000 });
      } else {
        toast.error(error.message || t('studentManager.creationFailed'));
      }
      throw error;
    }
  };

  const confirmResetDevice = async () => {
    if (!studentToReset) return;
    try {
      setLoading(true);
      setIsResetDeviceOpen(false);
      await studentApi.resetDeviceLock(studentToReset.id);
      toast.success(t('studentManager.deviceLockReset'));
      setStudentToReset(null);
      fetchData();
    } catch (error) {
      console.error('Reset device error:', error);
      toast.error(t('studentManager.failedToResetDevice'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (studentId: string, newPassword: string) => {
    if (!newPassword) { toast.error(t('studentManager.pleaseEnterPassword')); return; }
    if (newPassword.length < 4) { toast.error(t('studentManager.passwordMinLength')); return; }
    try {
      await studentApi.changeStudentPassword(studentId, newPassword);
      toast.success(t('studentManager.passwordUpdatedFor', { name: studentToChangePassword?.full_name }));
      setIsPasswordModalOpen(false);
      setStudentToChangePassword(null);
      fetchData();
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.message || t('studentManager.failedToChangePassword'));
      throw error;
    }
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      setLoading(true);
      setIsDeleteConfirmOpen(false);
      await studentApi.deleteStudent(studentToDelete.id);
      toast.success(t('studentManager.studentDeleted'));
      setStudentToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t('studentManager.failedToDeleteStudent'));
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToClass = async (classId: string) => {
    if (!selectedStudent) return;
    try {
      await classApi.addStudentToClass(classId, selectedStudent.id);
      toast.success(t('studentManager.enrolled'));
      setIsAssignModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.code === '23505' ? t('studentManager.alreadyEnrolled') : t('studentManager.failedToEnroll'));
    }
  };

  const handleRemoveFromClass = async (studentId: string) => {
    if (selectedClassId === 'all') return;
    if (!window.confirm(t('studentManager.removeFromClassConfirm'))) return;
    try {
      setLoading(true);
      await classApi.removeStudentFromClass(selectedClassId, studentId);
      toast.success(t('studentManager.removedFromClass'));
      fetchData();
    } catch (error) {
      toast.error(t('studentManager.failedToRemove'));
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
        title={t('studentManager.title')}
        badge={t('studentManager.badge')}
        subtitle={t('studentManager.subtitleText')}
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-primary-200 transition-all active:scale-95 text-sm"
          >
            <Plus size={18} />
            {t('studentManager.newStudent')}
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput containerClassName="flex-1 max-w-sm" placeholder={t('studentManager.searchStudents')} value={searchQuery} onChange={setSearchQuery} />
        <Select containerClassName="flex-1 max-w-xs" icon={<Users size={16} />} value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
          <option value="all">{t('studentManager.allStudents')}</option>
          {classes.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </Select>
        <Select containerClassName="flex-1 max-w-[180px]" icon={<Smartphone size={16} />} value={deviceFilter} onChange={(e) => setDeviceFilter(e.target.value as any)}>
          <option value="all">{t('studentManager.allDevices')}</option>
          <option value="locked">{t('studentManager.lockedOnly')}</option>
          <option value="unlocked">{t('studentManager.unlockedOnly')}</option>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={<User size={14} className="text-blue-500" />} value={students.length} label={selectedClassId === 'all' ? t('studentManager.totalStudents') : t('studentManager.inClass')} color="bg-blue-50" />
        <StatCard icon={<Smartphone size={14} className="text-rose-500" />} value={students.filter(s => s.device_lock_active).length} label={t('studentManager.lockedDevices')} color="bg-rose-50" />
        <StatCard icon={<ShieldCheck size={14} className="text-emerald-500" />} value={classes.length} label={t('studentManager.classes')} color="bg-emerald-50" />
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
        emptyText={t('studentManager.noStudentsFound')}
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
        title={t('studentManager.resetDeviceLock')}
        message={<>{t('studentManager.resetDeviceMessage')} <span className="text-slate-900 font-black">{studentToReset?.full_name}</span> {t('studentManager.resetDeviceMessage2')}</>}
        confirmLabel={t('studentManager.yesResetLock')}
        confirmColor="amber"
      />

      <ConfirmDialog
        open={isDeleteConfirmOpen && !!studentToDelete}
        onClose={() => { setIsDeleteConfirmOpen(false); setStudentToDelete(null); }}
        onConfirm={confirmDelete}
        icon={<Trash2 size={32} />}
        iconBg="bg-rose-50 text-rose-500"
        title={t('studentManager.areYouSure')}
        message={<>{t('studentManager.aboutToDelete')} <span className="text-slate-900 font-black">{studentToDelete?.full_name}</span>. {t('studentManager.cannotBeUndone')}</>}
        confirmLabel={t('studentManager.yesDeleteStudent')}
        cancelLabel={t('studentManager.noKeepIt')}
        confirmColor="rose"
      />
    </div>
  );
};

export default StudentManager;
