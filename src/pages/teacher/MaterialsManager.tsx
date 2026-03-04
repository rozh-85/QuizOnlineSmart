import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, FileText, Upload, Link as LinkIcon, File, Search, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Button, Card, Modal, Input, TextArea } from '../../components/ui';
import MaterialFileIcon from '../../components/MaterialFileIcon';
import { useQuiz } from '../../context/QuizContext';
import { materialApi } from '../../api/materialApi';
import { Material, MaterialFileType } from '../../types/app';

const MaterialsManager = () => {
  const { t } = useTranslation();
  const { lectures, materials, addMaterial, updateMaterial, deleteMaterial } = useQuiz();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLecture, setFilterLecture] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterType, setFilterType] = useState('');

  const allSections = useMemo(() => {
    const secs = new Set<string>();
    materials.forEach(m => { if (m.sectionId) secs.add(m.sectionId); });
    return Array.from(secs).sort();
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return materials.filter(m => {
      if (q) {
        const titleMatch = m.title.toLowerCase().includes(q);
        const contentMatch = m.content?.toLowerCase().includes(q);
        const fileMatch = m.fileName?.toLowerCase().includes(q);
        if (!titleMatch && !contentMatch && !fileMatch) return false;
      }
      if (filterLecture && m.lectureId !== filterLecture) return false;
      if (filterSection && m.sectionId !== filterSection) return false;
      if (filterType && m.fileType !== filterType) return false;
      return true;
    });
  }, [materials, searchQuery, filterLecture, filterSection, filterType]);

  const activeFilterCount = [filterLecture, filterSection, filterType].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterLecture('');
    setFilterSection('');
    setFilterType('');
  };

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    fileUrl: '',
    fileName: '',
    fileType: 'note' as MaterialFileType,
    lectureId: '',
    sectionId: ''
  });

  const selectedLecture = lectures.find(l => l.id === formData.lectureId);

  const handleOpenModal = (material?: Material) => {
    if (material) {
      setEditingId(material.id);
      setFormData({
        title: material.title,
        content: material.content || '',
        fileUrl: material.fileUrl || '',
        fileName: material.fileName || '',
        fileType: material.fileType,
        lectureId: material.lectureId || '',
        sectionId: material.sectionId || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        content: '',
        fileUrl: '',
        fileName: '',
        fileType: 'note',
        lectureId: lectures.length > 0 ? lectures[0].id : '',
        sectionId: (lectures.length > 0 && lectures[0].sections.length > 0) ? lectures[0].sections[0] : ''
      });
    }
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { publicUrl, fileName } = await materialApi.uploadFile(file);
      setFormData(prev => ({
        ...prev,
        fileUrl: publicUrl,
        fileName: fileName,
        fileType: file.type.includes('pdf') ? 'pdf' : 'word'
      }));
      toast.success(t('materialsManager.fileUploaded'));
    } catch (error: any) {
      console.error(error);
      const msg = error.message || t('materialsManager.failedToUpload');
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.lectureId) {
      toast.error(t('materialsManager.pleaseFillRequired'));
      return;
    }

    try {
      if (editingId) {
        await updateMaterial(editingId, formData);
        toast.success(t('materialsManager.materialUpdated'));
      } else {
        await addMaterial(formData);
        toast.success(t('materialsManager.materialAdded'));
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error(error);
      const msg = error.message || t('materialsManager.failedToSave');
      toast.error(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('materialsManager.confirmDelete'))) {
      try {
        await deleteMaterial(id);
        toast.success(t('materialsManager.materialDeleted'));
      } catch (error) {
        console.error(error);
        toast.error(t('materialsManager.failedToDelete'));
      }
    }
  };

  const selectClass = "h-9 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all appearance-none cursor-pointer w-full";
  const SelectWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="relative">
      {children}
      <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{t('materialsManager.title')}</h1>
          <p className="text-slate-500 mt-1 font-medium">{t('materialsManager.subtitle')}</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="shadow-lg shadow-primary-200">
          <Plus size={20} />
          <span>{t('materialsManager.addMaterial')}</span>
        </Button>
      </div>

      {/* Search & Filter Toolbar */}
      {materials.length > 0 && (
        <div className="mb-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('materialsManager.searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 ps-9 pe-8 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              <SelectWrapper>
                <select value={filterLecture} onChange={e => { setFilterLecture(e.target.value); setFilterSection(''); }} className={selectClass}>
                  <option value="">{t('materialsManager.allLectures')}</option>
                  {lectures.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </SelectWrapper>
              <SelectWrapper>
                <select value={filterSection} onChange={e => setFilterSection(e.target.value)} className={selectClass}>
                  <option value="">{t('materialsManager.allSections')}</option>
                  {(filterLecture
                    ? lectures.find(l => l.id === filterLecture)?.sections || []
                    : allSections
                  ).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </SelectWrapper>
              <SelectWrapper>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className={selectClass}>
                  <option value="">{t('materialsManager.allTypes')}</option>
                  <option value="note">{t('materialsManager.note')}</option>
                  <option value="pdf">PDF</option>
                  <option value="word">Word</option>
                </select>
              </SelectWrapper>
              {(activeFilterCount > 0 || searchQuery) && (
                <button onClick={clearAllFilters} className="h-9 px-3 rounded-lg text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-all flex items-center gap-1.5">
                  <X size={12} />
                  {t('common.clear')}
                </button>
              )}
            </div>
          </div>

          {/* Result count */}
          {(searchQuery || activeFilterCount > 0) && (
            <p className="text-xs font-semibold text-slate-400">
              {t('materialsManager.showing')} <span className="text-slate-700">{filteredMaterials.length}</span> {t('materialsManager.of')} {materials.length} {t('materialsManager.materialsCount')}
            </p>
          )}
        </div>
      )}

      {/* Table */}
      {materials.length === 0 ? (
        <Card className="border-slate-100">
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <FileText size={40} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{t('materialsManager.noMaterialsFound')}</h3>
            <p className="text-slate-500 max-w-xs mx-auto mb-6">{t('materialsManager.startByAdding')}</p>
            <Button onClick={() => handleOpenModal()} variant="secondary">
              {t('materialsManager.createFirstMaterial')}
            </Button>
          </div>
        </Card>
      ) : filteredMaterials.length === 0 ? (
        <Card className="border-slate-100">
          <div className="py-16 text-center">
            <Search size={32} className="text-slate-200 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">{t('materialsManager.noMatchingMaterials')}</h3>
            <p className="text-slate-400 text-sm mb-4">{t('materialsManager.tryAdjusting')}</p>
            <button onClick={clearAllFilters} className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors">
              {t('materialsManager.clearAllFilters')}
            </button>
          </div>
        </Card>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="text-start ps-5 pe-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 whitespace-nowrap">{t('materialsManager.titleCol')}</th>
                  <th className="text-start px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 whitespace-nowrap">{t('materialsManager.typeCol')}</th>
                  <th className="text-start px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 whitespace-nowrap">{t('materialsManager.lectureCol')}</th>
                  <th className="text-start px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 whitespace-nowrap">{t('materialsManager.sectionCol')}</th>
                  <th className="text-start px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 whitespace-nowrap">{t('materialsManager.contentFileCol')}</th>
                  <th className="w-20 px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((material) => (
                  <tr key={material.id} className="group border-t border-slate-100 hover:bg-primary-50/40 transition-colors">
                    <td className="ps-5 pe-3 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MaterialFileIcon fileType={material.fileType} className="w-7 h-7 shrink-0" iconSize={14} />
                        <span className="font-semibold text-[13px] text-slate-800 truncate max-w-[180px]">{material.title}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        material.fileType === 'note'
                          ? 'bg-amber-100/70 text-amber-700'
                          : material.fileType === 'pdf'
                            ? 'bg-rose-100/70 text-rose-700'
                            : 'bg-blue-100/70 text-blue-700'
                      }`}>
                        {material.fileType}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[12px] text-slate-600 font-medium truncate block max-w-[150px]">
                        {lectures.find(l => l.id === material.lectureId)?.title || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {material.sectionId ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-[9px] font-black uppercase tracking-wider text-slate-600">
                          {material.sectionId}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 max-w-[200px]">
                      {material.fileType === 'note' && material.content ? (
                        <p className="text-slate-500 text-[11px] line-clamp-1 leading-relaxed">{material.content}</p>
                      ) : material.fileUrl ? (
                        <a href={material.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                        >
                          <LinkIcon size={10} className="shrink-0" />
                          <span className="truncate max-w-[140px]">{material.fileName || t('materialsManager.viewAttachment')}</span>
                        </a>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-end">
                      <div className="inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(material)} title="Edit"
                          className="p-1.5 rounded-md text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(material.id)} title="Delete"
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? t('materialsManager.editMaterial') : t('materialsManager.addNewMaterial')}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label={t('materialsManager.materialTitle')}
                placeholder={t('materialsManager.materialTitlePlaceholder')}
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('materialsManager.lecture')}</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm font-semibold bg-white"
                value={formData.lectureId}
                onChange={e => {
                  const lecId = e.target.value;
                  const lec = lectures.find(l => l.id === lecId);
                  setFormData({ 
                    ...formData, 
                    lectureId: lecId, 
                    sectionId: lec?.sections[0] || '' 
                  });
                }}
              >
                <option value="" disabled>{t('materialsManager.selectLecture')}</option>
                {lectures.map(l => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('materialsManager.section')}</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm font-semibold bg-white"
                value={formData.sectionId}
                onChange={e => setFormData({ ...formData, sectionId: e.target.value })}
              >
                <option value="" disabled>{t('materialsManager.selectSection')}</option>
                {selectedLecture?.sections.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
             <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('materialsManager.materialType')}</label>
              <div className="flex p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => setFormData({ ...formData, fileType: 'note' })}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${
                    formData.fileType === 'note' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >{t('materialsManager.note')}</button>
                <button
                  onClick={() => setFormData({ ...formData, fileType: 'pdf' })}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${
                    formData.fileType !== 'note' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >{t('materialsManager.file')}</button>
              </div>
            </div>

            {formData.fileType === 'note' ? (
              <TextArea
                label={t('materialsManager.noteContent')}
                placeholder={t('materialsManager.writeNotesHere')}
                rows={6}
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
              />
            ) : (
              <div className="space-y-4">
                <div 
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                    isUploading ? 'bg-slate-50 border-slate-200' : 'border-slate-200 hover:border-primary-400 hover:bg-primary-50/30'
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer group">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-3 border border-slate-100 group-hover:scale-110 transition-transform">
                      <Upload size={20} className="text-primary-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      {isUploading ? t('materialsManager.uploading') : formData.fileName || t('materialsManager.clickToUpload')}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1">{t('materialsManager.maxFileSize')}</p>
                  </label>
                </div>
                {formData.fileUrl && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <File size={16} className="text-slate-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-700 truncate">{formData.fileName}</span>
                    </div>
                    <button 
                      onClick={() => setFormData({ ...formData, fileUrl: '', fileName: '', fileType: 'note' })}
                      className="text-rose-500 hover:text-rose-600 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-slate-900 border-slate-900 shadow-lg shadow-slate-200" disabled={isUploading}>
              {editingId ? t('materialsManager.saveChanges') : t('materialsManager.createMaterial')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MaterialsManager;
