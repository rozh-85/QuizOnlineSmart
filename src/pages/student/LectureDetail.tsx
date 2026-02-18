import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  ExternalLink, 
  MessageCircle,
  Clock
} from 'lucide-react';
import { lectureService, materialService } from '../../services/supabaseService';
import LectureQA from '../../components/LectureQA';
import toast from 'react-hot-toast';

const LectureDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [lecture, setLecture] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const threadId = searchParams.get('threadId') || undefined;
  const [activeTab, setActiveTab] = useState<'content' | 'qa'>(
    searchParams.get('tab') === 'qa' ? 'qa' : 'content'
  );

  useEffect(() => {
    if (id) fetchData(id);
  }, [id]);

  const fetchData = async (lectureId: string) => {
    try {
      setLoading(true);
      const [lectureData, materialData] = await Promise.all([
        lectureService.getById(lectureId),
        materialService.getByLecture(lectureId)
      ]);
      setLecture(lectureData);
      setMaterials(materialData);
    } catch (error) {
      console.error('Fetch lecture error:', error);
      toast.error('Failed to load lecture details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pb-36 sm:pb-20">
        {/* Skeleton Header */}
        <div className="bg-white border-b border-slate-100 sticky top-0 sm:top-16 z-30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-200/60 animate-pulse" />
              <div className="space-y-2">
                <div className="w-40 h-5 rounded bg-slate-200/60 animate-pulse" />
                <div className="w-24 h-3 rounded bg-slate-200/60 animate-pulse" />
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 p-1 bg-slate-50 rounded-xl">
              <div className="w-24 h-9 rounded-lg bg-slate-200/60 animate-pulse" />
              <div className="w-24 h-9 rounded-lg bg-slate-200/60 animate-pulse" />
            </div>
          </div>
        </div>
        {/* Skeleton Body */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 space-y-8">
          <div className="bg-white p-10 sm:p-14 rounded-3xl border border-slate-100 space-y-6 animate-pulse">
            <div className="w-16 h-16 rounded-2xl bg-slate-200/60" />
            <div className="w-48 h-7 rounded bg-slate-200/60" />
            <div className="w-full h-4 rounded bg-slate-200/60" />
            <div className="w-3/4 h-4 rounded bg-slate-200/60" />
            <div className="flex gap-10 pt-8 border-t border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-200/60" />
                <div className="space-y-2">
                  <div className="w-16 h-3 rounded bg-slate-200/60" />
                  <div className="w-20 h-4 rounded bg-slate-200/60" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-200/60" />
                <div className="space-y-2">
                  <div className="w-16 h-3 rounded bg-slate-200/60" />
                  <div className="w-20 h-4 rounded bg-slate-200/60" />
                </div>
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {[1, 2].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-white border border-slate-100 animate-pulse p-6 flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-slate-200/60" />
                <div className="space-y-2 flex-1">
                  <div className="w-32 h-4 rounded bg-slate-200/60" />
                  <div className="w-20 h-3 rounded bg-slate-200/60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-36 sm:pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 sm:top-16 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all border border-transparent hover:border-slate-100"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-tight uppercase truncate max-w-[180px] sm:max-w-md tracking-tight">
                {lecture?.title}
              </h1>
              <div className="flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest mt-0.5">
                <BookOpen size={10} /> Chapter {lecture?.order_index || 1}
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100/50">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${
                activeTab === 'content' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Content
            </button>
            <button
              onClick={() => setActiveTab('qa')}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${
                activeTab === 'qa' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Q&A Hub
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-12">
        {activeTab === 'content' ? (
          <div className="space-y-12 animate-fade-in-up">
            {/* Intro Card */}
            <div className="bg-white p-10 sm:p-14 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full translate-x-1/2 -translate-y-1/2 opacity-50"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-10 shadow-xl shadow-slate-200">
                  <BookOpen size={28} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tighter uppercase">Lecture Overview</h2>
                <p className="text-slate-500 text-base font-medium leading-relaxed whitespace-pre-wrap max-w-3xl">
                  {lecture?.description || 'Learn and master this special chemistry unit with comprehensive materials and mentor support.'}
                </p>
                
                <div className="mt-12 pt-10 border-t border-slate-50 flex flex-wrap gap-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100/50">
                      <Clock size={20} />
                    </div>
                    <div>
                      <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.15em] mb-1">Time Estimate</div>
                      <div className="text-sm font-black text-slate-700 uppercase tracking-tighter">45 mins</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100/50">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.15em] mb-1">Resources</div>
                      <div className="text-sm font-black text-slate-700 uppercase tracking-tighter">{materials.length} Materials</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Materials Section */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-4 px-2">
                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Companion Materials</h3>
                <div className="h-px flex-1 bg-slate-100"></div>
              </div>

              {materials.length === 0 ? (
                <div className="py-24 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm mb-4 flex items-center justify-center text-slate-200">
                    <FileText size={28} />
                  </div>
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">No materials linked to this lecture</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-5">
                  {materials.map((m) => (
                    <a 
                      key={m.id}
                      href={m.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-white p-6 rounded-2xl border border-slate-100 hover:border-primary-500 shadow-sm flex items-center justify-between transition-all hover:-translate-y-1 relative overflow-hidden"
                    >
                      <div className="flex items-center gap-5 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-all duration-300 border border-slate-100/50">
                          <FileText size={22} />
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{m.title}</div>
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{m.file_type || 'PDF DOCUMENT'}</div>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg text-slate-300 group-hover:text-primary-600 transition-colors">
                        <ExternalLink size={16} />
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* CTA Section */}
            <div className="bg-slate-900 p-12 rounded-3xl text-white flex flex-col sm:flex-row items-center justify-between gap-10 shadow-2xl shadow-slate-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:opacity-20 transition-all"></div>
              <div className="relative z-10 text-center sm:text-left">
                <div className="inline-flex px-3 py-1 bg-white/10 rounded-lg text-primary-400 text-[9px] font-black uppercase tracking-[0.2em] mb-4 backdrop-blur-md">Mentor Support</div>
                <h3 className="text-2xl font-black mb-3 uppercase tracking-tight">Need help with this unit?</h3>
                <p className="text-slate-400 text-sm font-medium">Head over to the Q&A Hub and start a private discussion.</p>
              </div>
              <button 
                onClick={() => setActiveTab('qa')}
                className="relative z-10 px-10 py-5 bg-white text-slate-900 font-black rounded-xl shadow-xl shadow-slate-900/10 hover:bg-primary-500 hover:text-white transition-all uppercase text-[11px] tracking-[0.2em] flex items-center gap-3"
              >
                OPEN Q&A HUB <MessageCircle size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in bg-white p-8 sm:p-14 rounded-3xl border border-slate-100 shadow-sm min-h-[600px]">
             <div className="flex items-center gap-4 px-2 mb-10">
                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Communication Center</h3>
                <div className="h-px flex-1 bg-slate-100"></div>
              </div>
            {id && <LectureQA lectureId={id} initialThreadId={threadId} />}
          </div>
        )}
      </main>

      {/* Mobile Nav - raised above bottom navigation bar */}
      <div className="sm:hidden fixed bottom-[72px] left-1/2 -translate-x-1/2 w-[90%] bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-1.5 flex shadow-2xl z-40">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${
            activeTab === 'content' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'
          }`}
        >
          CONTENT
        </button>
        <button
          onClick={() => setActiveTab('qa')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${
            activeTab === 'qa' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'
          }`}
        >
          Q&A HUB
        </button>
      </div>
    </div>
  );
};

export default LectureDetail;
