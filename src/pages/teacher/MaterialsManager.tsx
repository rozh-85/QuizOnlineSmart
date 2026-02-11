import { useState } from 'react';
import { Plus, Edit2, Trash2, FileText, Upload, Link as LinkIcon, File } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button, Card, Modal, Input, TextArea } from '../../components/ui';
import { useQuiz } from '../../context/QuizContext';
import { materialService } from '../../services/supabaseService';
import { Material, MaterialFileType } from '../../types';

const MaterialsManager = () => {
  const { lectures, materials, addMaterial, updateMaterial, deleteMaterial } = useQuiz();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
      const { publicUrl, fileName } = await materialService.uploadFile(file);
      setFormData(prev => ({
        ...prev,
        fileUrl: publicUrl,
        fileName: fileName,
        fileType: file.type.includes('pdf') ? 'pdf' : 'word'
      }));
      toast.success('File uploaded successfully');
    } catch (error: any) {
      console.error(error);
      const msg = error.message || 'Failed to upload file';
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.lectureId) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      if (editingId) {
        await updateMaterial(editingId, formData);
        toast.success('Material updated');
      } else {
        await addMaterial(formData);
        toast.success('Material added');
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error(error);
      const msg = error.message || 'Failed to save material';
      toast.error(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await deleteMaterial(id);
        toast.success('Material deleted');
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete material');
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Materials.</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage lecture notes and resources</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="shadow-lg shadow-primary-200">
          <Plus size={20} />
          <span>Add Material</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((material) => (
          <Card key={material.id} className="p-6 hover:shadow-lg transition-all group border-slate-100">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                material.fileType === 'note' ? 'bg-amber-50 text-amber-600' : 
                material.fileType === 'pdf' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {material.fileType === 'note' ? <FileText size={24} /> : <File size={24} />}
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleOpenModal(material)}
                  className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(material.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight">{material.title}</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                {lectures.find(l => l.id === material.lectureId)?.title || 'Unknown Lecture'}
              </span>
              {material.sectionId && (
                <span className="px-2 py-0.5 rounded-md bg-primary-50 text-[10px] font-black uppercase tracking-wider text-primary-600">
                  {material.sectionId}
                </span>
              )}
            </div>

            {material.content && (
              <p className="text-slate-500 text-sm line-clamp-3 mb-4 leading-relaxed">
                {material.content}
              </p>
            )}

            {material.fileUrl && (
              <a 
                href={material.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors mt-auto"
              >
                <LinkIcon size={14} />
                <span className="truncate">{material.fileName || 'View Attachment'}</span>
              </a>
            )}
          </Card>
        ))}

        {materials.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <FileText size={40} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No materials found</h3>
            <p className="text-slate-500 max-w-xs mx-auto mb-6">Start by adding your first lecture notes or uploading a PDF document.</p>
            <Button onClick={() => handleOpenModal()} variant="secondary">
              Create First Material
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Material' : 'Add New Material'}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Material Title"
                placeholder="e.g., Introduction to Periodic Table"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lecture</label>
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
                <option value="" disabled>Select a lecture</option>
                {lectures.map(l => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm font-semibold bg-white"
                value={formData.sectionId}
                onChange={e => setFormData({ ...formData, sectionId: e.target.value })}
              >
                <option value="" disabled>Select a section</option>
                {selectedLecture?.sections.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
             <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Material Type</label>
              <div className="flex p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => setFormData({ ...formData, fileType: 'note' })}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${
                    formData.fileType === 'note' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >Note</button>
                <button
                  onClick={() => setFormData({ ...formData, fileType: 'pdf' })}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${
                    formData.fileType !== 'note' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >File</button>
              </div>
            </div>

            {formData.fileType === 'note' ? (
              <TextArea
                label="Note Content"
                placeholder="Write your lecture notes here..."
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
                      {isUploading ? 'Uploading...' : formData.fileName || 'Click to upload PDF or Word'}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1">Maximum file size 10MB</p>
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
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-slate-900 border-slate-900 shadow-lg shadow-slate-200" disabled={isUploading}>
              {editingId ? 'Save Changes' : 'Create Material'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MaterialsManager;
