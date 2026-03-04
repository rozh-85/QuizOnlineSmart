import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, HelpCircle, ChevronDown, ChevronRight, Layers, BarChart3 as BarChart, Users, BookOpen, GraduationCap, FileText, Eye, EyeOff, Sparkles, ShieldCheck, ClipboardCheck, Megaphone, ArrowRight, Gauge } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button, Modal, SearchInput, StatCard, EmptyState, Card } from '../../components/ui';
import { useQuiz } from '../../context/QuizContext';
import { Question } from '../../types';
import { QuestionCard } from '../../components/dashboard';
import { studentApi } from '../../api/studentApi';
import { classApi } from '../../api/classApi';

const TeacherDashboard = () => {
  const { questions, lectures, materials, deleteQuestion, toggleQuestionVisibility } = useQuiz();
  const [studentCount, setStudentCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLectures, setExpandedLectures] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [quickView, setQuickView] = useState<Record<string, boolean>>({});
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; question: Question | null }>({
    isOpen: false,
    question: null,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [students, classes] = await Promise.all([
          studentApi.getAll(),
          classApi.getAll()
        ]);
        setStudentCount(students.length);
        setClassCount(classes.length);
      } catch (error) {
        console.error('Failed to fetch counts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  const toggleLecture = (lectureId: string) => {
    setExpandedLectures(prev => ({ ...prev, [lectureId]: !prev[lectureId] }));
  };

  const toggleSection = (lectureId: string, sectionName: string) => {
    const key = `${lectureId}-${sectionName}`;
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleQuickView = (questionId: string) => {
    setQuickView(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const allQuestions = questions.filter(q => q.lectureId);
  const filteredQuestions = allQuestions.filter(q => {
    const searchLower = searchTerm.toLowerCase();
    return (
      q.text.toLowerCase().includes(searchLower) ||
      q.explanation?.toLowerCase().includes(searchLower) ||
      q.type.toLowerCase().includes(searchLower)
    );
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const visibleQuestions = allQuestions.filter(q => q.isVisible !== false).length;
  const hiddenQuestions = allQuestions.length - visibleQuestions;

  const easyCount = allQuestions.filter(q => q.difficulty === 'easy').length;
  const mediumCount = allQuestions.filter(q => q.difficulty === 'medium').length;
  const hardCount = allQuestions.filter(q => q.difficulty === 'hard').length;

  const mcCount = allQuestions.filter(q => q.type === 'multiple-choice').length;
  const tfCount = allQuestions.filter(q => q.type === 'true-false').length;
  const blankCount = allQuestions.filter(q => q.type === 'blank').length;

  const quickActions = [
    { icon: Plus, label: 'New Question', desc: 'Create a new question', path: '/admin/new', color: 'bg-indigo-50 text-indigo-600' },
    { icon: Sparkles, label: 'AI Generator', desc: 'Generate with AI', path: '/admin/ai-generator', color: 'bg-purple-50 text-purple-600' },
    { icon: ClipboardCheck, label: 'Attendance', desc: 'Start a session', path: '/admin/attendance', color: 'bg-emerald-50 text-emerald-600' },
    { icon: ShieldCheck, label: 'Exam Builder', desc: 'Build an exam', path: '/admin/exam-builder', color: 'bg-amber-50 text-amber-600' },
    { icon: BarChart, label: 'Reports', desc: 'View analytics', path: '/admin/reports', color: 'bg-rose-50 text-rose-600' },
    { icon: Megaphone, label: "What's New", desc: 'Publish updates', path: '/admin/whats-new', color: 'bg-cyan-50 text-cyan-600' },
  ];

  // Grouping Logic
  const groupedQuestions = filteredQuestions.reduce((acc, q) => {
    const lectureId = q.lectureId!;
    const sectionId = q.sectionId || 'General Section';
    
    if (!acc[lectureId]) acc[lectureId] = {};
    if (!acc[lectureId][sectionId]) acc[lectureId][sectionId] = [];
    
    acc[lectureId][sectionId].push(q);
    return acc;
  }, {} as Record<string, Record<string, Question[]>>);

  const handleDeleteClick = (question: Question) => {
    setDeleteModal({ isOpen: true, question });
  };

  const confirmDelete = () => {
    if (deleteModal.question) {
      deleteQuestion(deleteModal.question.id);
      toast.success('Question deleted successfully');
    }
    setDeleteModal({ isOpen: false, question: null });
  };

  return (
    <div className="animate-fade-in w-full space-y-8">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-indigo-100 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-1">{getGreeting()} 👋</h1>
            <p className="text-sm font-medium text-slate-500">{getFormattedDate()}</p>
          </div>
          <Link to="/admin/new">
            <Button size="md" className="shadow-lg shadow-indigo-200">
              <Plus size={18} />
              <span>New Question</span>
            </Button>
          </Link>
        </div>
      </Card>

      {/* Overview Stats */}
      <div>
        <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <BarChart size={20} className="text-indigo-600" />
          Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard 
            icon={<Users size={16} className="text-indigo-600" />} 
            value={loading ? '...' : studentCount} 
            label="Students" 
            color="bg-indigo-50"
            valueColor="text-indigo-700"
            borderColor="border-indigo-100"
          />
          <StatCard 
            icon={<BookOpen size={16} className="text-emerald-600" />} 
            value={loading ? '...' : classCount} 
            label="Classes" 
            color="bg-emerald-50"
            valueColor="text-emerald-700"
            borderColor="border-emerald-100"
          />
          <StatCard 
            icon={<GraduationCap size={16} className="text-purple-600" />} 
            value={lectures.length} 
            label="Lectures" 
            color="bg-purple-50"
            valueColor="text-purple-700"
            borderColor="border-purple-100"
          />
          <StatCard 
            icon={<HelpCircle size={16} className="text-amber-600" />} 
            value={allQuestions.length} 
            label="Questions" 
            color="bg-amber-50"
            valueColor="text-amber-700"
            borderColor="border-amber-100"
          />
          <StatCard 
            icon={<FileText size={16} className="text-rose-600" />} 
            value={materials.length} 
            label="Materials" 
            color="bg-rose-50"
            valueColor="text-rose-700"
            borderColor="border-rose-100"
          />
          <StatCard 
            icon={<Eye size={16} className="text-cyan-600" />} 
            value={`${visibleQuestions}/${allQuestions.length}`} 
            label="Visible" 
            color="bg-cyan-50"
            valueColor="text-cyan-700"
            borderColor="border-cyan-100"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles size={20} className="text-indigo-600" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link key={idx} to={action.path}>
                <Card className="hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer group h-full">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-slate-900 mb-1">{action.label}</h3>
                      <p className="text-xs text-slate-500 font-medium">{action.desc}</p>
                    </div>
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content Breakdown */}
      <div>
        <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <Layers size={20} className="text-indigo-600" />
          Content Breakdown
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Difficulty Distribution */}
          <Card>
            <h3 className="text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
              <Gauge size={16} className="text-slate-600" />
              Questions by Difficulty
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Easy</span>
                  <span className="text-xs font-black text-slate-900">{easyCount}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${allQuestions.length ? (easyCount / allQuestions.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Medium</span>
                  <span className="text-xs font-black text-slate-900">{mediumCount}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${allQuestions.length ? (mediumCount / allQuestions.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Hard</span>
                  <span className="text-xs font-black text-slate-900">{hardCount}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 rounded-full transition-all"
                    style={{ width: `${allQuestions.length ? (hardCount / allQuestions.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Type & Visibility */}
          <Card>
            <h3 className="text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
              <HelpCircle size={16} className="text-slate-600" />
              Questions by Type & Visibility
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Multiple Choice</span>
                  <span className="text-xs font-black text-slate-900">{mcCount}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${allQuestions.length ? (mcCount / allQuestions.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">True/False</span>
                  <span className="text-xs font-black text-slate-900">{tfCount}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${allQuestions.length ? (tfCount / allQuestions.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-cyan-600 uppercase tracking-wider">Fill in Blank</span>
                  <span className="text-xs font-black text-slate-900">{blankCount}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-500 rounded-full transition-all"
                    style={{ width: `${allQuestions.length ? (blankCount / allQuestions.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                    <Eye size={12} /> Visible
                  </span>
                  <span className="text-xs font-black text-slate-900">{visibleQuestions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <EyeOff size={12} /> Hidden
                  </span>
                  <span className="text-xs font-black text-slate-900">{hiddenQuestions}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Question Bank Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <HelpCircle size={20} className="text-indigo-600" />
            Question Bank
          </h2>
          <div className="px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">
              {allQuestions.length} Total
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 max-w-xl">
          <SearchInput
            placeholder="Search by keyword, type, or explanation..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>

        {/* Grouped Questions List */}
        {filteredQuestions.length === 0 ? (
          <EmptyState
            icon={<HelpCircle size={48} />}
            title="No Matches Found."
            subtitle="Try adjusting your search or add a new question."
            action={
              <Link to="/admin/new">
                <Button size="lg">
                  <Plus size={20} />
                  Add Question
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedQuestions).map(([lectureId, sections]) => {
            const lecture = lectures.find(l => l.id === lectureId);
            const isExpanded = searchTerm ? true : expandedLectures[lectureId];
            const totalInLecture = Object.values(sections).flat().length;

              if (!lecture) return null;

              return (
                <div key={lectureId} className="space-y-2">
                  <button 
                    onClick={() => toggleLecture(lectureId)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${
                      isExpanded ? 'bg-slate-50 border-slate-200 ring-2 ring-primary-50' : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isExpanded ? 'bg-primary-600 text-white' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-black text-slate-900 tracking-tight">
                          {lecture.title}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                          {totalInLecture} {totalInLecture === 1 ? 'Question' : 'Questions'} available
                        </p>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="pl-4 sm:pl-8 space-y-3 animate-in fade-in slide-in-from-left-2">
                      {Object.entries(sections).map(([sectionId, qList]) => {
                        const isSectionExpanded = searchTerm ? true : expandedSections[`${lectureId}-${sectionId}`];
                        
                        return (
                          <div key={sectionId} className="space-y-2">
                            <button 
                              onClick={() => toggleSection(lectureId, sectionId)}
                              className="flex items-center gap-2 py-1 px-2 hover:bg-slate-50 rounded-lg transition-colors group"
                            >
                              {isSectionExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-primary-600">
                                {sectionId}
                              </span>
                              <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">
                                {qList.length}
                              </span>
                            </button>

                            {isSectionExpanded && (
                              <div className="space-y-3 pl-3 border-l-[3px] border-slate-100 ml-1.5 animate-in fade-in slide-in-from-top-1">
                                {qList.map((question, idx) => (
                                  <QuestionCard
                                    key={question.id}
                                    question={question}
                                    index={idx}
                                    quickView={quickView[question.id]}
                                    onToggleQuickView={() => toggleQuickView(question.id)}
                                    onToggleVisibility={() => {
                                      toggleQuestionVisibility(question.id, !question.isVisible);
                                      toast.success(question.isVisible ? 'Question hidden from students' : 'Question visible to students');
                                    }}
                                    onDelete={() => handleDeleteClick(question)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, question: null })}
        title="Delete Question"
      >
        <p className="text-slate-600 font-semibold mb-8 leading-relaxed">
          Are you sure you want to delete this question? This action cannot be undone and will be removed from the library forever.
        </p>
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            onClick={() => setDeleteModal({ isOpen: false, question: null })}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmDelete}
            className="flex-1"
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default TeacherDashboard;
