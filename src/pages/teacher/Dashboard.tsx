import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, HelpCircle, ChevronDown, ChevronRight, MessageSquare, Layers, BarChart3 as BarChart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button, Modal, PageHeader, SearchInput, StatCard, EmptyState } from '../../components/ui';
import { useQuiz } from '../../context/QuizContext';
import { Question } from '../../types';
import { QuestionCard } from '../../components/dashboard';

const TeacherDashboard = () => {
  const { questions, lectures, deleteQuestion, toggleQuestionVisibility } = useQuiz();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLectures, setExpandedLectures] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [quickView, setQuickView] = useState<Record<string, boolean>>({});
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; question: Question | null }>({
    isOpen: false,
    question: null,
  });

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

  const filteredQuestions = questions.filter(q => {
    const searchLower = searchTerm.toLowerCase();
    // Only show questions assigned to a lecture
    if (!q.lectureId) return false;
    
    return (
      q.text.toLowerCase().includes(searchLower) ||
      q.explanation?.toLowerCase().includes(searchLower) ||
      q.type.toLowerCase().includes(searchLower)
    );
  });

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

  const stats = [
    { 
      label: 'Total Questions', 
      val: filteredQuestions.length,
      icon: <HelpCircle size={14} className="text-primary-500" />,
      color: 'bg-primary-50'
    },
    { 
      label: 'Explanatory', 
      val: filteredQuestions.filter(q => q.explanation?.trim()).length,
      icon: <MessageSquare size={14} className="text-emerald-500" />,
      color: 'bg-emerald-50'
    },
    { 
      label: 'Option Density', 
      val: filteredQuestions.reduce((acc, q) => acc + (q.options?.length || 0), 0),
      icon: <Layers size={14} className="text-amber-500" />,
      color: 'bg-amber-50'
    },
    { 
      label: 'Avg Options', 
      val: filteredQuestions.length > 0 
        ? (filteredQuestions.reduce((acc, q) => acc + (q.options?.length || 0), 0) / filteredQuestions.length).toFixed(1)
        : '0.0',
      icon: <BarChart size={14} className="text-purple-500" />,
      color: 'bg-purple-50'
    }
  ];

  return (
    <div className="animate-fade-in w-full">
      {/* Header & Search Area */}
      <PageHeader
        title="Questions."
        badge="Pro Library"
        badgeColor="bg-primary-50 text-primary-600 border-primary-100"
        action={
          <Link to="/admin/new">
            <Button size="sm" className="w-full sm:w-auto shadow-md shadow-primary-200 h-10 px-6">
              <Plus size={18} />
              <span>New Question</span>
            </Button>
          </Link>
        }
      />

      {/* Search */}
      <div className="mb-6 max-w-xl">
        <SearchInput
          placeholder="Search by keyword, type, or explanation..."
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <StatCard key={i} icon={stat.icon} value={stat.val} label={stat.label} color={stat.color} />
        ))}
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
