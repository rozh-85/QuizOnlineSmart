import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  User, 
  Smartphone, 
  Link as LinkIcon, 
  ShieldCheck,
  SmartphoneNfc,
  ChevronDown,
  ChevronRight,
  AtSign,
  Info,
  Copy,
  Users,
  UserMinus,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { studentService, classService } from '../../services/supabaseService';
import toast from 'react-hot-toast';

const StudentManager = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'locked' | 'unlocked'>('all');
  
  const [newStudent, setNewStudent] = useState({
    fullName: '',
    serialId: '',
    pin: '',
    classId: ''
  });

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isViewInfoOpen, setIsViewInfoOpen] = useState(false);

  // For showing credentials immediately after creation
  const [createdStudentInfo, setCreatedStudentInfo] = useState<any>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

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

  const handleNameChange = (name: string) => {
    const updates: any = { fullName: name };
    if (!newStudent.serialId) {
      const cleanName = name.replace(/[^a-zA-Z]/g, '').toLowerCase().slice(0, 3);
      if (cleanName.length >= 2) {
        updates.serialId = `${cleanName}${Math.floor(100 + Math.random() * 900)}`;
      }
    }
    setNewStudent({ ...newStudent, ...updates });
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;

    if (!newStudent.fullName || !newStudent.serialId || !newStudent.pin) {
      toast.error('Required fields missing');
      return;
    }

    try {
      setCreating(true);
      const signUpResult = await studentService.createStudent(newStudent.fullName, newStudent.serialId, newStudent.pin);
      const studentId = (signUpResult as any).user?.id || (signUpResult as any).id;
      
      if (newStudent.classId && studentId) {
        await classService.addStudentToClass(newStudent.classId, studentId);
      }
      
      setCreatedStudentInfo({
        fullName: newStudent.fullName,
        serialId: newStudent.serialId,
        pin: newStudent.pin
      });
      
      setIsModalOpen(false);
      setIsSuccessModalOpen(true);
      setNewStudent({ fullName: '', serialId: '', pin: '', classId: '' });
      fetchData();
    } catch (error: any) {
      console.error('Creation failed:', error);
      if (error.message?.includes('rate limit')) {
        toast.error('Supabase Rate Limit! Go to Dashboard > Auth > Settings > Rate Limits and increase the Signups limit.', { duration: 6000 });
      } else {
        toast.error(error.message || 'Creation failed');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleResetDevice = async (id: string) => {
    if (!window.confirm('Reset device lock?')) return;
    try {
      await studentService.resetDeviceLock(id);
      toast.success('Reset complete');
      fetchData();
    } catch (error) {
      toast.error('Reset failed');
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.serial_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDevice = deviceFilter === 'all' 
      ? true 
      : deviceFilter === 'locked' 
        ? s.device_lock_active 
        : !s.device_lock_active;

    return matchesSearch && matchesDevice;
  });

  return (
    <div className="animate-fade-in w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Students.</h1>
            <div className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border border-slate-200">
              Directory
            </div>
          </div>
          <p className="text-sm text-slate-400 font-medium">Manage student accounts and access control</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-primary-200 transition-all active:scale-95 text-sm"
        >
          <Plus size={18} />
          New Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 appearance-none cursor-pointer text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all shadow-sm"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="all">All Students</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search students..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all placeholder:text-slate-300 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="relative flex-1 max-w-[180px]">
          <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 appearance-none cursor-pointer text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all shadow-sm"
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value as any)}
          >
            <option value="all">All Devices</option>
            <option value="locked">Locked Only</option>
            <option value="unlocked">Unlocked Only</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-blue-50">
              <User size={14} className="text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 leading-none">{students.length}</div>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {selectedClassId === 'all' ? 'Total Students' : 'In Class'}
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-rose-50">
              <Smartphone size={14} className="text-rose-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 leading-none">
              {students.filter(s => s.device_lock_active).length}
            </div>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Locked Devices</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-emerald-50">
              <ShieldCheck size={14} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 leading-none">{classes.length}</div>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Classes</div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Serial ID</th>
                <th className="px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Device</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && students.length === 0 ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded-lg w-40" /></td>
                    <td className="px-4 py-4 text-center"><div className="h-6 bg-slate-100 rounded-lg w-20 mx-auto" /></td>
                    <td className="px-4 py-4 text-center"><div className="w-3 h-3 bg-slate-100 rounded-full mx-auto" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 bg-slate-100 rounded-lg w-28 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                        <Users size={28} />
                      </div>
                      <span className="font-bold text-sm text-slate-400">No students found</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        {s.full_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{s.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{s.email || `${s.serial_id}@kimya.com`}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 border border-slate-200">
                      {s.serial_id || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        s.device_lock_active 
                          ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${s.device_lock_active ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        {s.device_lock_active ? 'Locked' : 'Free'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1">
                      {selectedClassId !== 'all' && (
                        <button 
                          onClick={() => handleRemoveFromClass(s.id)}
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Remove from class"
                        >
                          <UserMinus size={15} />
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setSelectedStudent(s);
                          setIsViewInfoOpen(true);
                        }}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                        title="View details"
                      >
                        <Info size={15} />
                      </button>
                      <button 
                        onClick={() => { setSelectedStudent(s); setIsAssignModalOpen(true); }}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        title="Assign to class"
                      >
                        <LinkIcon size={15} />
                      </button>
                      <button 
                        onClick={() => handleResetDevice(s.id)}
                        disabled={!s.device_lock_active}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none"
                        title="Reset device"
                      >
                        <SmartphoneNfc size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 animate-scale-in relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">New Student</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Create a new student account</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>
             
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary-500 focus:bg-white rounded-xl outline-none font-medium text-slate-900 text-sm transition-all focus:ring-4 focus:ring-primary-50"
                  placeholder="e.g. John Doe"
                  value={newStudent.fullName}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Serial ID</label>
                  <div className="relative">
                    <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl outline-none font-bold text-sm transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-50 placeholder:text-slate-300"
                      placeholder="ID"
                      value={newStudent.serialId}
                      onChange={(e) => setNewStudent({...newStudent, serialId: e.target.value.toLowerCase()})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">PIN</label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary-500 focus:bg-white rounded-xl outline-none font-bold tracking-widest text-sm text-center transition-all focus:ring-4 focus:ring-primary-50"
                    placeholder="••••"
                    value={newStudent.pin}
                    onChange={(e) => setNewStudent({...newStudent, pin: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Assign to Class (optional)</label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary-500 focus:bg-white rounded-xl outline-none font-medium text-slate-700 appearance-none cursor-pointer text-sm transition-all focus:ring-4 focus:ring-primary-50"
                    value={newStudent.classId}
                    onChange={(e) => setNewStudent({...newStudent, classId: e.target.value})}
                  >
                    <option value="">No class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={14} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold text-sm hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-md shadow-primary-200 text-sm flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-primary-700 disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="animate-spin" size={14} /> Creating...
                    </>
                  ) : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && createdStudentInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 animate-scale-in relative flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6">
               <ShieldCheck size={32} />
            </div>

            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">{createdStudentInfo.fullName}</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">Account created successfully</p>
            
            <div className="w-full space-y-4 mb-8">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Login Email</div>
                <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl flex items-center justify-between">
                   <span className="text-sm font-bold text-slate-900">{createdStudentInfo.serialId}@kimya.com</span>
                   <button onClick={() => copyToClipboard(`${createdStudentInfo.serialId}@kimya.com`, 'Email')} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-slate-400 hover:text-slate-900 border border-slate-200 transition-all active:scale-90">
                    <Copy size={12} />
                   </button>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">PIN</div>
                <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl flex items-center justify-between">
                   <span className="text-lg font-black text-slate-900 tracking-widest">{createdStudentInfo.pin}</span>
                   <button onClick={() => copyToClipboard(createdStudentInfo.pin, 'PIN')} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-slate-400 hover:text-slate-900 border border-slate-200 transition-all active:scale-90">
                    <Copy size={12} />
                   </button>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl shadow-md shadow-primary-200 text-sm transition-all active:scale-95 hover:bg-primary-700"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* View Info Modal */}
      {isViewInfoOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 animate-scale-in relative flex flex-col items-center">
            <button onClick={() => setIsViewInfoOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
              <X size={18} />
            </button>
            
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 mb-5">
               <User size={28} />
            </div>

            <h3 className="text-xl font-black text-slate-900 tracking-tight text-center mb-1">{selectedStudent.full_name}</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">Student Profile</p>

            <div className="w-full space-y-4 mb-6">
              <div className="text-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Email</label>
                <div className="px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-900 text-sm">
                  {selectedStudent.serial_id || selectedStudent.email?.split('@')[0] || 'N/A'}@kimya.com
                </div>
              </div>

              <div className="text-center">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">PIN</label>
                <div className="px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 font-black text-slate-900 text-lg tracking-widest">
                  {selectedStudent.pin_display || '••••'}
                </div>
                {!selectedStudent.pin_display && (
                  <div className="mt-2 flex items-center gap-1.5 justify-center">
                    <AlertCircle size={10} className="text-slate-300" />
                    <p className="text-[10px] text-slate-300 font-medium">PIN not available for display</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsViewInfoOpen(false)}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-sm transition-all active:scale-95 hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Assign to Class Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 sm:p-8 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <LinkIcon size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Assign Class</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Choose a class for {selectedStudent?.full_name}</p>
                </div>
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-auto">
              {classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleAssignToClass(c.id)}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-primary-50 hover:text-primary-700 rounded-xl transition-all font-bold text-sm text-slate-700 border border-slate-200 hover:border-primary-200 group/item"
                >
                  {c.name}
                  <ChevronRight size={14} className="text-slate-300 group-hover/item:text-primary-500 group-hover/item:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
            
            <button onClick={() => setIsAssignModalOpen(false)} className="w-full mt-4 py-2.5 text-slate-400 hover:text-slate-900 font-bold text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManager;
