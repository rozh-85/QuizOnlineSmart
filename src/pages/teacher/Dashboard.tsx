import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, HelpCircle, ChevronDown, ChevronRight, Layers, BarChart3 as BarChart, Users, BookOpen, GraduationCap, FileText, Eye, EyeOff, Sparkles, ShieldCheck, ClipboardCheck, Megaphone, ArrowRight, Gauge, X, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Button, Modal, SearchInput, StatCard, EmptyState, Card } from '../../components/ui';
import { useQuiz } from '../../context/QuizContext';
import { Question } from '../../types';
import { QuestionCard } from '../../components/dashboard';
import { studentApi } from '../../api/studentApi';
import { classApi } from '../../api/classApi';

const TeacherDashboard = () => {
  const { questions, lectures, materials, deleteQuestion, toggleQuestionVisibility } = useQuiz();
  const { t } = useTranslation();
  const [studentCount, setStudentCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
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

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    Object.keys(groupedQuestions).forEach(lectureId => {
      allExpanded[lectureId] = true;
    });
    setExpandedLectures(allExpanded);
  };

  const collapseAll = () => {
    setExpandedLectures({});
  };

  const toggleFilter = (filter: string) => {
    if (filter === 'all') {
      setActiveFilters([]);
    } else {
      setActiveFilters(prev => 
        prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
      );
    }
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
    const matchesSearch = 
      q.text.toLowerCase().includes(searchLower) ||
      q.explanation?.toLowerCase().includes(searchLower) ||
      q.type.toLowerCase().includes(searchLower);
    
    if (!matchesSearch) return false;
    if (activeFilters.length === 0) return true;

    return activeFilters.every(filter => {
      if (filter === 'easy' || filter === 'medium' || filter === 'hard') {
        return q.difficulty === filter;
      }
      if (filter === 'mc') return q.type === 'multiple-choice';
      if (filter === 'tf') return q.type === 'true-false';
      if (filter === 'blank') return q.type === 'blank';
      if (filter === 'visible') return q.isVisible !== false;
      if (filter === 'hidden') return q.isVisible === false;
      return true;
    });
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning');
    if (hour < 18) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
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
    { icon: Plus, label: t('quickActions.newQuestion'), desc: t('quickActions.createQuestion'), path: '/admin/new', color: 'bg-indigo-50 text-indigo-600' },
    { icon: Sparkles, label: t('quickActions.aiGenerator'), desc: t('quickActions.generateWithAI'), path: '/admin/ai-generator', color: 'bg-purple-50 text-purple-600' },
    { icon: ClipboardCheck, label: t('quickActions.attendance'), desc: t('quickActions.startSession'), path: '/admin/attendance', color: 'bg-emerald-50 text-emerald-600' },
    { icon: ShieldCheck, label: t('quickActions.examBuilder'), desc: t('quickActions.buildExam'), path: '/admin/exam-builder', color: 'bg-amber-50 text-amber-600' },
    { icon: BarChart, label: t('quickActions.reports'), desc: t('quickActions.viewAnalytics'), path: '/admin/reports', color: 'bg-rose-50 text-rose-600' },
    { icon: Megaphone, label: t('quickActions.whatsNew'), desc: t('quickActions.publishUpdates'), path: '/admin/whats-new', color: 'bg-cyan-50 text-cyan-600' },
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
      toast.success(t('dashboard.questionDeleted'));
    }
    setDeleteModal({ isOpen: false, question: null });
  };

  return (
    <div className="animate-fade-in w-full space-y-8">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-indigo-100 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-1">{getGreeting()}</h1>
            <p className="text-sm font-medium text-slate-500">{getFormattedDate()}</p>
          </div>
          <Link to="/admin/new">
            <Button size="md" className="shadow-lg shadow-indigo-200">
              <Plus size={18} />
              <span>{t('quickActions.newQuestion')}</span>
            </Button>
          </Link>
        </div>
      </Card>

      {/* Overview Stats */}
      <div>
        <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <BarChart size={20} className="text-indigo-600" />
          {t('dashboard.overview')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard 
            icon={<Users size={16} className="text-indigo-600" />} 
            value={loading ? '...' : studentCount} 
            label={t('stats.students')} 
            color="bg-indigo-50"
            valueColor="text-indigo-700"
            borderColor="border-indigo-100"
          />
          <StatCard 
            icon={<BookOpen size={16} className="text-emerald-600" />} 
            value={loading ? '...' : classCount} 
            label={t('stats.classes')} 
            color="bg-emerald-50"
            valueColor="text-emerald-700"
            borderColor="border-emerald-100"
          />
          <StatCard 
            icon={<GraduationCap size={16} className="text-purple-600" />} 
            value={lectures.length} 
            label={t('stats.lectures')} 
            color="bg-purple-50"
            valueColor="text-purple-700"
            borderColor="border-purple-100"
          />
          <StatCard 
            icon={<HelpCircle size={16} className="text-amber-600" />} 
            value={allQuestions.length} 
            label={t('stats.questions')} 
            color="bg-amber-50"
            valueColor="text-amber-700"
            borderColor="border-amber-100"
          />
          <StatCard 
            icon={<FileText size={16} className="text-rose-600" />} 
            value={materials.length} 
            label={t('stats.materials')} 
            color="bg-rose-50"
            valueColor="text-rose-700"
            borderColor="border-rose-100"
          />
          <StatCard 
            icon={<Eye size={16} className="text-cyan-600" />} 
            value={`${visibleQuestions}/${allQuestions.length}`} 
            label={t('stats.visible')} 
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
          {t('dashboard.quickActions')}
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
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all flex-shrink-0" />
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
          {t('dashboard.contentBreakdown')}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Difficulty Distribution */}
          <Card>
            <h3 className="text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
              <Gauge size={16} className="text-slate-600" />
              {t('dashboard.questionsByDifficulty')}
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{t('dashboard.easy')}</span>
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
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">{t('dashboard.medium')}</span>
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
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">{t('dashboard.hard')}</span>
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
              {t('dashboard.questionsByType')}
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{t('dashboard.multipleChoice')}</span>
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
                  <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">{t('dashboard.trueFalse')}</span>
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
                  <span className="text-xs font-bold text-cyan-600 uppercase tracking-wider">{t('dashboard.fillInBlank')}</span>
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
                    <Eye size={12} /> {t('dashboard.visible')}
                  </span>
                  <span className="text-xs font-black text-slate-900">{visibleQuestions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <EyeOff size={12} /> {t('dashboard.hidden')}
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <HelpCircle size={20} className="text-indigo-600" />
            {t('dashboard.questionBank')}
            <div className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100">
              <span className="text-xs font-black text-indigo-600">
                {allQuestions.length}
              </span>
            </div>
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-all"
            >
              <Maximize2 size={12} />
              {t('dashboard.expandAll')}
            </button>
            <button
              onClick={collapseAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 transition-all"
            >
              <Minimize2 size={12} />
              {t('dashboard.collapseAll')}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <SearchInput
            placeholder={t('dashboard.searchPlaceholder')}
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => toggleFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeFilters.length === 0
                ? 'bg-indigo-600 text-white border border-indigo-600'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-200 hover:text-indigo-600'
            }`}
          >
            {t('common.all')}
          </button>
          <div className="w-px h-4 bg-slate-200" />
          <button
            onClick={() => toggleFilter('easy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeFilters.includes('easy')
                ? 'bg-emerald-600 text-white border border-emerald-600'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-200 hover:text-emerald-600'
            }`}
          >
            {t('dashboard.easy')}
          </button>
          <button
            onClick={() => toggleFilter('medium')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeFilters.includes('medium')
                ? 'bg-amber-600 text-white border border-amber-600'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-amber-200 hover:text-amber-600'
            }`}
          >
            {t('dashboard.medium')}
          </button>
          <button
            onClick={() => toggleFilter('hard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeFilters.includes('hard')
                ? 'bg-rose-600 text-white border border-rose-600'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-rose-200 hover:text-rose-600'
            }`}
          >
            {t('dashboard.hard')}
          </button>
          <div className="w-px h-4 bg-slate-200" />
          <button
            onClick={() => toggleFilter('mc')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeFilters.includes('mc')
                ? 'bg-indigo-600 text-white border border-indigo-600'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-200 hover:text-indigo-600'
            }`}
          >
            {t('dashboard.mc')}
          </button>
          <button
            onClick={() => toggleFilter('tf')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeFilters.includes('tf')
                ? 'bg-purple-600 text-white border border-purple-600'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-purple-200 hover:text-purple-600'
            }`}
          >
            {t('dashboard.tf')}
          </button>
          <button
            onClick={() => toggleFilter('blank')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeFilters.includes('blank')
                ? 'bg-cyan-600 text-white border border-cyan-600'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-cyan-200 hover:text-cyan-600'
            }`}
          >
            {t('dashboard.blank')}
          </button>
          <div className="w-px h-4 bg-slate-200" />
          <button
            onClick={() => toggleFilter('visible')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
              activeFilters.includes('visible')
                ? 'bg-emerald-600 text-white border border-emerald-600'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-200 hover:text-emerald-600'
            }`}
          >
            <Eye size={10} />
            {t('dashboard.visible')}
          </button>
          <button
            onClick={() => toggleFilter('hidden')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
              activeFilters.includes('hidden')
                ? 'bg-slate-600 text-white border border-slate-600'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <EyeOff size={10} />
            {t('dashboard.hidden')}
          </button>
          {activeFilters.length > 0 && (
            <>
              <div className="w-px h-4 bg-slate-200" />
              <button
                onClick={() => setActiveFilters([])}
                className="px-2 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center gap-1"
              >
                <X size={12} />
                {t('common.clear')}
              </button>
            </>
          )}
        </div>

        {/* Grouped Questions List */}
        {filteredQuestions.length === 0 ? (
          <EmptyState
            icon={<HelpCircle size={48} />}
            title={t('dashboard.noMatchesFound')}
            subtitle={activeFilters.length > 0 ? t('dashboard.noMatchesFilters', { filters: activeFilters.join(', ') }) : t('dashboard.noMatchesSearch')}
            action={
              activeFilters.length > 0 ? (
                <Button onClick={() => setActiveFilters([])} size="lg">
                  <X size={18} />
                  {t('common.clearFilters')}
                </Button>
              ) : (
                <Link to="/admin/new">
                  <Button size="lg">
                    <Plus size={20} />
                  {t('dashboard.addQuestion')}
                  </Button>
                </Link>
              )
            }
          />
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedQuestions).map(([lectureId, sections], idx) => {
            const lecture = lectures.find(l => l.id === lectureId);
            const isExpanded = searchTerm ? true : expandedLectures[lectureId];
            const questionsInLecture = Object.values(sections).flat();
            const totalInLecture = questionsInLecture.length;
            const visibleInLecture = questionsInLecture.filter(q => q.isVisible !== false).length;
            const easyInLecture = questionsInLecture.filter(q => q.difficulty === 'easy').length;
            const mediumInLecture = questionsInLecture.filter(q => q.difficulty === 'medium').length;
            const hardInLecture = questionsInLecture.filter(q => q.difficulty === 'hard').length;
            
            const colors = ['indigo', 'emerald', 'purple', 'amber', 'rose', 'cyan'];
            const color = colors[idx % colors.length];

              if (!lecture) return null;

              return (
                <div key={lectureId} className="space-y-2">
                  <button 
                    onClick={() => toggleLecture(lectureId)}
                    className={`w-full flex items-start justify-between p-4 rounded-xl transition-all border border-slate-200 hover:border-${color}-200 hover:shadow-md group ${
                      isExpanded ? `bg-slate-50 ring-2 ring-${color}-100 border-${color}-200` : 'bg-white'
                    } border-s-4 border-s-${color}-500`}
                    style={{ borderInlineStartColor: `var(--color-${color}-500)` }}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                        isExpanded ? `bg-${color}-600 text-white` : `bg-${color}-50 text-${color}-600 group-hover:bg-${color}-100`
                      }`}
                        style={{
                          backgroundColor: isExpanded ? `var(--color-${color}-600)` : `var(--color-${color}-50)`,
                          color: isExpanded ? 'white' : `var(--color-${color}-600)`
                        }}
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                      <div className="text-start flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-sm font-black text-slate-900 tracking-tight">
                            {lecture.title}
                          </h4>
                          <div className="px-2 py-0.5 rounded-full text-[10px] font-black" 
                            style={{ backgroundColor: `var(--color-${color}-100)`, color: `var(--color-${color}-700)` }}>
                            {totalInLecture}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                          <div className="flex items-center gap-1">
                            <Eye size={10} className="text-emerald-500" />
                            <span>{visibleInLecture}/{totalInLecture} {t('dashboard.visible').toLowerCase()}</span>
                          </div>
                          <div className="flex-1 max-w-[200px]">
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                              {easyInLecture > 0 && (
                                <div 
                                  className="bg-emerald-500" 
                                  style={{ width: `${(easyInLecture / totalInLecture) * 100}%` }}
                                  title={`${easyInLecture} easy`}
                                />
                              )}
                              {mediumInLecture > 0 && (
                                <div 
                                  className="bg-amber-500" 
                                  style={{ width: `${(mediumInLecture / totalInLecture) * 100}%` }}
                                  title={`${mediumInLecture} medium`}
                                />
                              )}
                              {hardInLecture > 0 && (
                                <div 
                                  className="bg-rose-500" 
                                  style={{ width: `${(hardInLecture / totalInLecture) * 100}%` }}
                                  title={`${hardInLecture} hard`}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="ps-4 sm:ps-12 space-y-3 animate-in fade-in slide-in-from-left-2">
                      {Object.entries(sections).map(([sectionId, qList]) => {
                        const isSectionExpanded = searchTerm ? true : expandedSections[`${lectureId}-${sectionId}`];
                        
                        return (
                          <div key={sectionId} className="space-y-2">
                            <button 
                              onClick={() => toggleSection(lectureId, sectionId)}
                              className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-50 rounded-lg transition-colors group"
                            >
                              <div className="w-2 h-2 rounded-full transition-colors" 
                                style={{ backgroundColor: `var(--color-${color}-400)` }} />
                              <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 group-hover:text-slate-900">
                                {sectionId}
                              </span>
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">
                                {qList.length}
                              </span>
                              {isSectionExpanded ? <ChevronDown size={12} className="text-slate-400 ms-auto" /> : <ChevronRight size={12} className="text-slate-400 ms-auto" />}
                            </button>

                            {isSectionExpanded && (
                              <div className="space-y-2 ps-4 border-s-2 ms-1 animate-in fade-in slide-in-from-top-1" 
                                style={{ borderColor: `var(--color-${color}-200)` }}>
                                {qList.map((question, idx) => (
                                  <QuestionCard
                                    key={question.id}
                                    question={question}
                                    index={idx}
                                    quickView={quickView[question.id]}
                                    onToggleQuickView={() => toggleQuickView(question.id)}
                                    onToggleVisibility={() => {
                                      toggleQuestionVisibility(question.id, !question.isVisible);
                                      toast.success(question.isVisible ? t('dashboard.questionHidden') : t('dashboard.questionVisible'));
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
        title={t('dashboard.deleteQuestion')}
      >
        <p className="text-slate-600 font-semibold mb-8 leading-relaxed">
          {t('dashboard.deleteConfirm')}
        </p>
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            onClick={() => setDeleteModal({ isOpen: false, question: null })}
            className="flex-1"
          >
            {t('common.cancel')}
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmDelete}
            className="flex-1"
          >
            {t('common.delete')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default TeacherDashboard;
