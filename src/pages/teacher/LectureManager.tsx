import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Search, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Button, Card, Modal, Input, TextArea } from '../../components/ui';
import { useQuiz } from '../../context/QuizContext';
import { Lecture } from '../../types';

const LectureManager = () => {
  const { t } = useTranslation();
  const { lectures, addLecture, updateLecture, deleteLecture, getQuestionsByLecture } = useQuiz();
  const [editModal, setEditModal] = useState<{ isOpen: boolean; lecture: Lecture | null }>({
    isOpen: false,
    lecture: null,
  });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; lecture: Lecture | null }>({
    isOpen: false,
    lecture: null,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ title: '', description: '', sections: [] as string[], order: 1 });

  const sortedLectures = useMemo(() => [...lectures].sort((a, b) => a.order - b.order), [lectures]);

  const filteredLectures = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sortedLectures;
    return sortedLectures.filter(l =>
      l.title.toLowerCase().includes(q) ||
      (l.description?.toLowerCase().includes(q) ?? false)
    );
  }, [sortedLectures, searchQuery]);

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
      toast.error(t('lectureManager.pleaseEnterTitle'));
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
      loading: editModal.lecture ? t('lectureManager.updatingLecture') : t('lectureManager.creatingLecture'),
      success: editModal.lecture ? t('lectureManager.lectureUpdated') : t('lectureManager.lectureCreated'),
      error: t('lectureManager.failedToSave'),
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
        loading: t('lectureManager.deletingLecture'),
        success: t('lectureManager.lectureDeleted'),
        error: t('lectureManager.failedToDelete'),
      });

      try {
        await promise;
        setDeleteModal({ isOpen: false, lecture: null });
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{t('lectureManager.title')}</h1>
          <p className="text-slate-500 mt-1 font-medium">{t('lectureManager.subtitle')}</p>
        </div>
        <Button onClick={() => openEditModal()} className="w-full sm:w-auto shadow-lg shadow-primary-200">
          <Plus size={20} />
          <span>{t('lectureManager.newLecture')}</span>
        </Button>
      </div>

      {/* Search Bar */}
      {lectures.length > 0 && (
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={t('lectureManager.searchLectures')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 ps-9 pe-8 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-xs font-semibold text-slate-400">
              {t('lectureManager.showing')} <span className="text-slate-700">{filteredLectures.length}</span> {t('lectureManager.of')} {lectures.length} {t('lectureManager.lecturesCount')}
            </p>
          )}
        </div>
      )}

      {lectures.length === 0 ? (
        <Card className="border-slate-100">
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={40} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{t('lectureManager.noLecturesYet')}</h3>
            <p className="text-slate-500 max-w-xs mx-auto mb-6">{t('lectureManager.startByCreating')}</p>
            <Button onClick={() => openEditModal()} variant="secondary">
              {t('lectureManager.createFirstLecture')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="text-start ps-5 pe-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 whitespace-nowrap">{t('lectureManager.lectureDetails')}</th>
                  <th className="text-start px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 whitespace-nowrap">{t('lectureManager.order')}</th>
                  <th className="text-start px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 whitespace-nowrap">{t('lectureManager.questions')}</th>
                  <th className="w-20 px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filteredLectures.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <Search size={28} className="text-slate-200 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-900 mb-1">{t('lectureManager.noMatchingLectures')}</p>
                      <p className="text-xs text-slate-400 mb-3">{t('lectureManager.tryDifferentSearch')}</p>
                      <button onClick={() => setSearchQuery('')} className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors">{t('lectureManager.clearSearch')}</button>
                    </td>
                  </tr>
                ) : filteredLectures.map((lecture) => {
                  const questionCount = getQuestionsByLecture(lecture.id).length;
                  return (
                    <tr key={lecture.id} className="group border-t border-slate-100 hover:bg-primary-50/40 transition-colors">
                      <td className="ps-5 pe-3 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shrink-0">
                            <BookOpen size={15} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-[13px] text-slate-800 block truncate max-w-[320px]">{lecture.title}</span>
                            {lecture.description && (
                              <span className="text-[11px] text-slate-400 block truncate max-w-[320px]">{lecture.description}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-[9px] font-black uppercase tracking-wider text-slate-600">
                          #{lecture.order}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-[12px] text-slate-600 font-medium">{questionCount} {t('lectureManager.questions')}</span>
                      </td>
                      <td className="px-3 py-3 text-end">
                        <div className="inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(lecture)}
                            title="Edit"
                            className="p-1.5 rounded-md text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, lecture })}
                            title="Delete"
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2.5 bg-slate-50/80 border-t border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400">
              {t('lectureManager.showing')} {filteredLectures.length} {t('lectureManager.of')} {lectures.length} {t('lectureManager.lecturesCount')}
            </p>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, lecture: null })}
        title={editModal.lecture ? t('lectureManager.editModule') : t('lectureManager.createNewModule')}
      >
        <div className="flex flex-col gap-5 pb-2">
          {/* Primary Information Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-8 flex flex-col gap-3">
              <Input
                label={t('lectureManager.moduleName')}
                placeholder={t('lectureManager.moduleNamePlaceholder')}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <TextArea
                label={t('lectureManager.description')}
                placeholder={t('lectureManager.briefSummary')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="md:col-span-4 self-start">
              <Input
                label={t('lectureManager.order')}
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
                {t('lectureManager.curriculumSections')}
              </label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, sections: [...formData.sections, `New Section ${formData.sections.length + 1}`] })}
                className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-1 hover:text-primary-700 transition-colors"
              >
                <Plus size={12} /> {t('lectureManager.addTopic')}
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
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('lectureManager.noSectionsYet')}</p>
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
              {t('common.cancel')}
            </Button>
            <Button 
              className="flex-1 h-11 bg-slate-900 border-slate-900 shadow-md shadow-slate-200"
              onClick={handleSave}
            >
              {editModal.lecture ? t('lectureManager.saveChanges') : t('lectureManager.createModule')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, lecture: null })}
        title={t('lectureManager.deleteLecture')}
      >
        <div className="space-y-4">
          <p className="text-slate-700 font-medium leading-relaxed">
            {t('lectureManager.confirmDelete')} <strong className="text-slate-900">{deleteModal.lecture?.title}</strong>?
          </p>
          <p className="text-sm text-slate-500">
            {t('lectureManager.deleteWarning')}
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setDeleteModal({ isOpen: false, lecture: null })}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={confirmDelete}
              className="flex-1 bg-rose-500 hover:bg-rose-600 border-rose-500"
            >
              {t('lectureManager.deleteLecture')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LectureManager;
