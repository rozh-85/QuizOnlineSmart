import { useState, useEffect } from 'react';
import { MessageSquare, BookOpen, Search } from 'lucide-react';
import { Card } from '../../components/ui';
import { lectureApi } from '../../api/lectureApi';
import type { Lecture } from '../../types/database';
import LectureQA from '../../components/LectureQA';
import { useTeacherUnreadByLecture } from '../../hooks/useUnreadCount';

const QAManager = () => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { unreadCounts } = useTeacherUnreadByLecture('qa-manager', selectedLectureId);

  useEffect(() => {
    const loadLectures = async () => {
      try {
        const data = await lectureApi.getAll();
        setLectures(data);
        
        // Auto-select first lecture with unread messages, or just first lecture
        if (data.length > 0) {
          const firstUnread = data.find(l => unreadCounts[l.id] > 0);
          setSelectedLectureId(firstUnread?.id || data[0].id);
        }
      } catch (e) {
        console.error('Error loading lectures:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadLectures();
  }, []);

  // Update selected lecture when unread counts change (only on initial load)
  useEffect(() => {
    if (!selectedLectureId && lectures.length > 0 && Object.keys(unreadCounts).length > 0) {
      const firstUnread = lectures.find(l => unreadCounts[l.id] > 0);
      if (firstUnread) {
        setSelectedLectureId(firstUnread.id);
      }
    }
  }, [unreadCounts, lectures, selectedLectureId]);

  if (isLoading) {
    return (
      <div className="animate-fade-in p-6">
        <div className="h-8 w-48 bg-slate-200 rounded mb-2 animate-pulse" />
        <div className="h-4 w-64 bg-slate-100 rounded mb-8 animate-pulse" />
        <div className="flex gap-6">
          <div className="w-72 space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
          <div className="flex-1 h-96 bg-slate-50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Q&A Management</h2>
        <p className="text-slate-600 mt-1">Monitor student questions and publish answers</p>
      </div>

      {/* Mobile: Select dropdown */}
      <div className="lg:hidden mb-4">
        <select
          value={selectedLectureId || ''}
          onChange={(e) => setSelectedLectureId(e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select a lecture</option>
          {lectures.map((lecture) => (
            <option key={lecture.id} value={lecture.id}>
              {lecture.title} {unreadCounts[lecture.id] > 0 ? `(${unreadCounts[lecture.id]} new)` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: Split panel */}
      <div className="hidden lg:flex gap-6 flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="p-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={14} />
                <h3 className="text-xs font-semibold text-slate-900">Lectures</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="text"
                  placeholder="Search lectures..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
              {lectures
                .filter(lecture => 
                  lecture.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  lecture.description?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((lecture) => (
                <button
                  key={lecture.id}
                  onClick={() => setSelectedLectureId(lecture.id)}
                  className={`w-full text-start px-2.5 py-2 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                    selectedLectureId === lecture.id ? 'bg-indigo-50 border-s-4 border-s-indigo-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-900 truncate">
                        {lecture.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {new Date(lecture.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {unreadCounts[lecture.id] > 0 && (
                      <div className="flex-shrink-0 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-semibold">
                        {unreadCounts[lecture.id]}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {selectedLectureId ? (
            <Card className="p-0 border-slate-200 bg-white h-full overflow-hidden">
              <LectureQA lectureId={selectedLectureId} compact isAdminView />
            </Card>
          ) : (
            <div className="h-full border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare size={48} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">Select a lecture to view Q&A</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Content only */}
      <div className="lg:hidden flex-1">
        {selectedLectureId ? (
          <Card className="p-0 border-slate-200 bg-white h-full overflow-hidden">
            <LectureQA lectureId={selectedLectureId} compact isAdminView />
          </Card>
        ) : (
          <div className="h-full border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-center">
            <div className="text-center p-8">
              <MessageSquare size={48} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Select a lecture above</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QAManager;
