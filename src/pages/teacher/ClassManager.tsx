import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Users, 
  ChevronDown, 
  UserMinus, 
  Edit2, 
  Check, 
  X,
  Loader2,
  BookOpen,
  ArrowRightLeft
} from 'lucide-react';
import { classService } from '../../services/supabaseService';
import toast from 'react-hot-toast';
import { PageHeader, EmptyState, DataTable, FormField } from '../../components/ui';

const ClassManager = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Student Move State
  const [movingStudent, setMovingStudent] = useState<any>(null);
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchClassStudents(selectedClassId);
    } else {
      setStudents([]);
    }
  }, [selectedClassId]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await classService.getAll();
      setClasses(data);
    } catch (error) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStudents = async (id: string) => {
    try {
      setStudentsLoading(true);
      const data = await classService.getClassStudents(id);
      setStudents(data);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setStudentsLoading(false);
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    try {
      setLoading(true);
      const created = await classService.create(newClassName);
      toast.success('Class created!');
      setNewClassName('');
      setIsCreateModalOpen(false);
      await fetchClasses();
      setSelectedClassId(created.id);
    } catch (error) {
      toast.error('Failed to create');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!editedName.trim() || editedName === selectedClass?.name) {
      setIsEditingName(false);
      return;
    }
    try {
      await classService.update(selectedClassId, editedName);
      toast.success('Renamed successfully');
      setIsEditingName(false);
      fetchClasses();
    } catch (error) {
      toast.error('Failed to update name');
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClassId) return;
    if (!window.confirm(`Delete "${selectedClass?.name}"? Students will not be deleted, only removed from this class.`)) return;
    
    try {
      setLoading(true);
      await classService.delete(selectedClassId);
      toast.success('Class deleted');
      setSelectedClassId('');
      fetchClasses();
    } catch (error) {
      toast.error('Failed to delete class');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    try {
      if (!window.confirm('Remove this student from the class?')) return;
      await classService.removeStudentFromClass(selectedClassId, studentId);
      toast.success('Student removed');
      fetchClassStudents(selectedClassId);
    } catch (error) {
      toast.error('Failed to remove student');
    }
  };

  const handleMoveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movingStudent || !targetClassId) return;
    if (targetClassId === selectedClassId) {
       toast.error('Student is already in this class');
       return;
    }
    
    try {
      setIsMoving(true);
      await classService.removeStudentFromClass(selectedClassId, movingStudent.id);
      await classService.addStudentToClass(targetClassId, movingStudent.id);
      
      toast.success(`Moved ${movingStudent.full_name} successfully`);
      setMovingStudent(null);
      setTargetClassId('');
      fetchClassStudents(selectedClassId);
      fetchClasses();
    } catch (error) {
      toast.error('Failed to move student');
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <div className="animate-fade-in w-full">
      {/* Header */}
      <PageHeader
        title="Classes."
        badge="Groups"
        subtitle="Manage classes and student enrollment"
        action={
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-primary-200 transition-all active:scale-95 text-sm"
          >
            <Plus size={18} />
            New Class
          </button>
        }
      />

      {/* Class Selector */}
      <div className="mb-6">
        <div className="relative max-w-xs">
          <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select 
            value={selectedClassId}
            onChange={(e) => { setSelectedClassId(e.target.value); e.target.blur(); }}
            className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:outline-none font-bold text-slate-700 appearance-none cursor-pointer text-sm focus:border-primary-500 focus:ring-4 focus:ring-primary-50 transition-all shadow-sm"
          >
            <option value="">Select a class...</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
        </div>
      </div>

      {/* Content Area */}
      {!selectedClassId ? (
        <EmptyState
          icon={<Users size={28} />}
          title="No Class Selected"
          subtitle="Select a class above to manage students"
        />
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Class Info Card */}
          <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input 
                    autoFocus
                    className="text-xl font-black text-slate-900 tracking-tight bg-slate-50 border border-slate-200 outline-none px-3 py-1.5 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-50 w-full max-w-[300px]"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                  />
                  <button onClick={handleUpdateName} className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setIsEditingName(false)} className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedClass?.name}</h2>
                  <button 
                    onClick={() => { setIsEditingName(true); setEditedName(selectedClass?.name || ''); }}
                    className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 bg-primary-50 text-primary-700 border border-primary-100 rounded-lg text-xs font-bold">
                  {students.length} {students.length === 1 ? 'Student' : 'Students'}
                </span>
                <span className="text-[10px] text-slate-300 font-medium">
                  ID: {selectedClass?.id?.substring(0, 8)}
                </span>
              </div>
            </div>

            <button 
              onClick={handleDeleteClass}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 font-bold text-xs rounded-xl transition-all border border-slate-200"
            >
              <Trash2 size={14} />
              Delete Class
            </button>
          </div>

          {/* Students Table */}
          <DataTable
            columns={[
              { label: 'Student' },
              { label: 'Serial ID' },
              { label: 'Actions', align: 'right' },
            ]}
            loading={studentsLoading}
            isEmpty={students.length === 0}
            emptyIcon={<Users size={24} />}
            emptyText="No students enrolled yet"
            skeletonRows={3}
          >
            {students.map((s) => (
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
                <td className="px-4 py-4">
                  <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 border border-slate-200">
                    {s.serial_id || s.email?.split('@')[0] || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-1">
                    <button 
                      onClick={() => {
                        setMovingStudent(s);
                        setTargetClassId('');
                      }}
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                      title="Move to another class"
                    >
                      <ArrowRightLeft size={15} />
                    </button>
                    <button 
                      onClick={() => handleRemoveStudent(s.id)}
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Remove from class"
                    >
                      <UserMinus size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      {/* Create Class Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 animate-scale-in relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">New Class</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Create a new class group</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>
              
            <form onSubmit={handleCreateClass} className="space-y-4">
              <FormField label="Class Name">
                <input
                  autoFocus
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary-500 focus:bg-white rounded-xl outline-none font-medium text-slate-900 text-sm transition-all focus:ring-4 focus:ring-primary-50"
                  placeholder="e.g. Grade 10-A"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                />
              </FormField>
              
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold text-sm hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
                  Cancel
                </button>
                <button 
                  disabled={loading}
                  type="submit" 
                  className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-md shadow-primary-200 text-sm flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={14} /> : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move Student Modal */}
      {movingStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[130] p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 sm:p-8 animate-scale-in relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <ArrowRightLeft size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Move Student</h3>
                  <p className="text-[10px] text-slate-400 font-medium">{movingStudent.full_name}</p>
                </div>
              </div>
              <button onClick={() => setMovingStudent(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleMoveStudent} className="space-y-4">
              <FormField label="Current Class">
                <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-400 text-sm select-none">
                  {selectedClass?.name}
                </div>
              </FormField>

              <FormField label="Move to">
                <div className="relative">
                  <select 
                    required
                    value={targetClassId}
                    onChange={(e) => setTargetClassId(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 focus:border-primary-500 focus:bg-white px-4 py-3 rounded-xl font-medium text-slate-700 outline-none cursor-pointer text-sm transition-all focus:ring-4 focus:ring-primary-50"
                  >
                    <option value="">Choose class...</option>
                    {classes.filter(c => c.id !== selectedClassId).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
              </FormField>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setMovingStudent(null)} className="flex-1 py-3 text-slate-500 font-bold text-sm hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
                  Cancel
                </button>
                <button 
                  disabled={isMoving || !targetClassId}
                  type="submit" 
                  className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-md shadow-primary-200 text-sm flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-primary-700 disabled:opacity-50"
                >
                  {isMoving ? <Loader2 className="animate-spin" size={14} /> : 'Move Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManager;
