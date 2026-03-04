import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  ExternalLink, 
  MessageCircle,
  Clock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { lectureApi } from '../../api/lectureApi';
import { materialApi } from '../../api/materialApi';
import LectureQA from '../../components/LectureQA';
import toast from 'react-hot-toast';

const LectureDetail = () => {
  const { t } = useTranslation();
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
  const qaSectionRef = useRef<HTMLDivElement>(null);
  const materialsSectionRef = useRef<HTMLDivElement>(null);
  const scrollTo = searchParams.get('scrollTo');

  // Sync activeTab with URL search params (handles re-navigation from chat)
  useEffect(() => {
    if (searchParams.get('tab') === 'qa') {
      setActiveTab('qa');
    }
  }, [searchParams]);

  // Auto-scroll to QA chat section when coming from chat page
  useEffect(() => {
    if (activeTab === 'qa' && threadId) {
      const timer = setTimeout(() => {
        qaSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [activeTab, threadId]);

  // Auto-scroll to materials section when coming from What's New
  useEffect(() => {
    if (scrollTo === 'materials' && !loading) {
      const timer = setTimeout(() => {
        materialsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [scrollTo, loading]);

  useEffect(() => {
    if (id) fetchData(id);
  }, [id]);

  const fetchData = async (lectureId: string) => {
    try {
      setLoading(true);
      const [lectureData, materialData] = await Promise.all([
        lectureApi.getById(lectureId),
        materialApi.getByLecture(lectureId)
      ]);
      setLecture(lectureData);
      setMaterials(materialData);
    } catch (error) {
      console.error('Fetch lecture error:', error);
      toast.error(t('lectureDetail.failedToLoad'));
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24 sm:pb-8">
        <div className="bg-white border-b border-slate-200 sticky top-0 sm:top-14 z-30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200 animate-pulse" />
            <div className="w-40 h-5 rounded bg-slate-200 animate-pulse" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 animate-pulse">
            <div className="w-48 h-6 rounded bg-slate-200" />
            <div className="w-full h-4 rounded bg-slate-200" />
            <div className="w-3/4 h-4 rounded bg-slate-200" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[1, 2].map(i => (
              <div key={i} className="h-16 rounded-xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 sm:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 sm:top-14 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-all border border-slate-200 bg-white"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-md">
                {lecture?.title}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <BookOpen size={11} /> {t('lectureDetail.chapter')} {lecture?.order_index || 1}
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'content' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('lectureDetail.content')}
            </button>
            <button
              onClick={() => setActiveTab('qa')}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'qa' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('lectureDetail.qa')}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'content' ? (
          <div className="space-y-5 animate-fade-in">
            {/* Intro Card */}
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-1">{t('lectureDetail.lectureOverview')}</h2>
                  <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">
                    {lecture?.description || t('lectureDetail.defaultDescription')}
                  </p>
                </div>
              </div>
              
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-6">
                <div className="flex items-center gap-2.5">
                  <Clock size={15} className="text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-400">{t('lectureDetail.estimate')}</div>
                    <div className="text-sm font-semibold text-slate-700">{t('lectureDetail.estimateTime')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <FileText size={15} className="text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-400">{t('lectureDetail.resources')}</div>
                    <div className="text-sm font-semibold text-slate-700">{materials.length} {t('lectureDetail.materials')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Materials Section */}
            <div ref={materialsSectionRef}>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 px-1">{t('lectureDetail.materials')}</h3>

              {materials.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
                  <FileText size={28} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">{t('lectureDetail.noMaterials')}</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {materials.map((m) => (
                    <a 
                      key={m.id}
                      href={m.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-sm flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                          <FileText size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-800 group-hover:text-primary-600 transition-colors">{m.title}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{m.file_type || t('lectureDetail.pdfDocument')}</div>
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-slate-300 group-hover:text-primary-500 transition-colors flex-shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* CTA Section */}
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-start">
                <h3 className="text-base font-semibold text-slate-900 mb-1">{t('lectureDetail.needHelp')}</h3>
                <p className="text-sm text-slate-500">{t('lectureDetail.startDiscussion')}</p>
              </div>
              <button 
                onClick={() => setActiveTab('qa')}
                className="px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-lg text-sm hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                {t('lectureDetail.openQA')} <MessageCircle size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div ref={qaSectionRef} id="qa-section" className="animate-fade-in bg-white p-5 sm:p-8 rounded-xl border border-slate-200 min-h-[500px]">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">{t('lectureDetail.qaDiscussion')}</h3>
            {id && <LectureQA lectureId={id} initialThreadId={threadId} />}
          </div>
        )}
      </main>

      {/* Mobile Tab Switcher */}
      <div className="sm:hidden fixed bottom-[68px] left-1/2 -translate-x-1/2 w-[88%] bg-white border border-slate-200 rounded-lg p-1 flex shadow-lg z-40">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 py-2.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'content' ? 'bg-slate-900 text-white' : 'text-slate-500'
          }`}
        >
          {t('lectureDetail.content')}
        </button>
        <button
          onClick={() => setActiveTab('qa')}
          className={`flex-1 py-2.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'qa' ? 'bg-slate-900 text-white' : 'text-slate-500'
          }`}
        >
          {t('lectureDetail.qa')}
        </button>
      </div>
    </div>
  );
};

export default LectureDetail;
