import { useState } from 'react';
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button, Card, Modal, Input, TextArea } from '../../components/ui';
import { useQuiz } from '../../context/QuizContext';
import { Lecture } from '../../types';

const LectureManager = () => {
  const { lectures, addLecture, updateLecture, deleteLecture, getQuestionsByLecture } = useQuiz();
  const [editModal, setEditModal] = useState<{ isOpen: boolean; lecture: Lecture | null }>({
    isOpen: false,
    lecture: null,
  });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; lecture: Lecture | null }>({
    isOpen: false,
    lecture: null,
  });
  const [formData, setFormData] = useState({ title: '', description: '', sections: [] as string[], order: 1 });

  const openEditModal = (lecture?: Lecture) => {
    if (lecture) {
      setFormData({ 
        title: lecture.title, 
        description: lecture.description, 
        sections: lecture.sections || [], 
        order: lecture.order 
      });
      setEditModal({ isOpen: true, lecture });
    } else {
      const maxOrder = lectures.length > 0 ? Math.max(...lectures.map(l => l.order)) : 0;
      setFormData({ 
        title: '', 
        description: '', 
        sections: ['Section 1', 'Section 2', 'Section 3'], // Default sections
        order: maxOrder + 1 
      });
      setEditModal({ isOpen: true, lecture: null });
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a lecture title');
      return;
    }

    const promise = (async () => {
      if (editModal.lecture) {
        await updateLecture(editModal.lecture.id, formData);
      } else {
        await addLecture(formData);
      }
    })();

    toast.promise(promise, {
      loading: editModal.lecture ? 'Updating lecture...' : 'Creating lecture...',
      success: editModal.lecture ? 'Lecture updated successfully' : 'Lecture created successfully',
      error: 'Failed to save lecture',
    });

    try {
      await promise;
      setEditModal({ isOpen: false, lecture: null });
      setFormData({ title: '', description: '', sections: [], order: 1 });
    } catch (error) {
      console.error(error);
    }
  };

  const confirmDelete = async () => {
    if (deleteModal.lecture) {
      const promise = (async () => {
        await deleteLecture(deleteModal.lecture!.id);
      })();
      
      toast.promise(promise, {
        loading: 'Deleting lecture...',
        success: 'Lecture deleted successfully',
        error: 'Failed to delete lecture',
      });

      try {
        await promise;
        setDeleteModal({ isOpen: false, lecture: null });
      } catch (error) {
        console.error(error);
      }
    }
  };

  const sortedLectures = [...lectures].sort((a, b) => a.order - b.order);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Lectures.</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage your chemistry lecture structure</p>
        </div>
        <Button onClick={() => openEditModal()} className="w-full sm:w-auto shadow-lg shadow-primary-200">
          <Plus size={20} />
          <span>New Lecture</span>
        </Button>
      </div>

      {/* Lectures Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedLectures.map((lecture) => {
          const questionCount = getQuestionsByLecture(lecture.id).length;

          return (
            <Card key={lecture.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-lg shadow-primary-200">
                  <BookOpen size={24} />
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200">
                  <span className="text-xs font-black text-slate-600">{questionCount} Questions</span>
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">{lecture.title}</h3>
              <p className="text-slate-500 text-sm font-medium mb-6 leading-relaxed min-h-[3rem]">
                {lecture.description}
              </p>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditModal(lecture)}
                  className="flex-1"
                >
                  <Edit2 size={16} />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteModal({ isOpen: true, lecture })}
                  className="flex-1 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 size={16} />
                  Delete
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {lectures.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} className="text-slate-300" />
          </div>
          <p className="text-slate-400 font-semibold mb-4">No lectures created yet.</p>
          <Button onClick={() => openEditModal()}>
            <Plus size={18} />
            Create First Lecture
          </Button>
        </div>
      )}

      {/* Edit/Create Modal */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, lecture: null })}
        title={editModal.lecture ? 'Edit Module' : 'Create New Module'}
      >
        <div className="flex flex-col gap-5 pb-2">
          {/* Primary Information Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-8 flex flex-col gap-3">
              <Input
                label="Module Name"
                placeholder="e.g., Quantum Chemistry Fundamentals"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <TextArea
                label="Description"
                placeholder="Brief summary..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="md:col-span-4 self-start">
              <Input
                label="Order"
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="h-px bg-slate-100/60" />

          {/* Sections Management */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Curriculum Sections
              </label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, sections: [...formData.sections, `New Section ${formData.sections.length + 1}`] })}
                className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-1 hover:text-primary-700 transition-colors"
              >
                <Plus size={12} /> Add Topic
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {formData.sections.map((section, index) => (
                <div key={index} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-colors group">
                  <div className="flex-1">
                    <input
                      placeholder="Topic name..."
                      value={section}
                      onChange={(e) => {
                        const newSections = [...formData.sections];
                        newSections[index] = e.target.value;
                        setFormData({ ...formData, sections: newSections });
                      }}
                      className="w-full bg-transparent text-[13px] font-bold text-slate-700 outline-none placeholder:text-slate-300"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sections: formData.sections.filter((_, i) => i !== index) })}
                    className="text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {formData.sections.length === 0 && (
                <div className="col-span-full py-6 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No sections added yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-100/60" />

          {/* Footer */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button
              variant="secondary"
              className="flex-1 h-11"
              onClick={() => setEditModal({ isOpen: false, lecture: null })}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 h-11 bg-slate-900 border-slate-900 shadow-md shadow-slate-200"
              onClick={handleSave}
            >
              {editModal.lecture ? 'Save Changes' : 'Create Module'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, lecture: null })}
        title="Delete Lecture"
      >
        <div className="space-y-4">
          <p className="text-slate-700 font-medium leading-relaxed">
            Are you sure you want to delete <strong className="text-slate-900">{deleteModal.lecture?.title}</strong>?
          </p>
          <p className="text-sm text-slate-500">
            Questions assigned to this lecture will not be deleted, but their lecture assignment will be removed.
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ isOpen: false, lecture: null })}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="flex-1 bg-rose-500 hover:bg-rose-600 border-rose-500"
            >
              Delete Lecture
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LectureManager;
