import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, HelpCircle, Search, ChevronDown, ChevronRight, Eye, EyeOff, CheckCircle, MessageSquare, Layers, BarChart3 as BarChart, Gauge } from 'lucide-react';
import previewIcon from '../../assets/icons/preview.png';
import { toast } from 'react-hot-toast';
import { Button, Card, Modal } from '../../components/ui';
import { useQuiz } from '../../context/QuizContext';
import { Question } from '../../types';

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

  return (
    <div className="animate-fade-in w-full">
      {/* Header & Search Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex-1 max-w-xl">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Questions.</h1>
            <div className="bg-primary-50 text-primary-600 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border border-primary-100">
              Pro Library
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search by keyword, type, or explanation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-primary-500 focus:ring-4 focus:ring-primary-50 outline-none transition-all placeholder:text-slate-300 shadow-sm"
            />
          </div>
        </div>
        <Link to="/admin/new" className="flex-shrink-0">
          <Button size="sm" className="w-full sm:w-auto shadow-md shadow-primary-200 h-10 px-6">
            <Plus size={18} />
            <span>New Question</span>
          </Button>
        </Link>
      </div>

      {/* Stats - Dynamic & Professional */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
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
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-xl ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-black text-slate-900 leading-none">{stat.val}</div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Grouped Questions List */}
      {filteredQuestions.length === 0 ? (
        <Card className="text-center py-20 bg-white border-2 border-dashed border-slate-100 shadow-none">
          <HelpCircle size={48} className="mx-auto text-slate-200 mb-6" />
          <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">No Matches Found.</h3>
          <p className="text-slate-500 mb-8 font-medium">Try adjusting your search or add a new question.</p>
          <Link to="/admin/new">
            <Button size="lg">
              <Plus size={20} />
              Add Question
            </Button>
          </Link>
        </Card>
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
                                <Card 
                                  key={question.id} 
                                  className="border border-slate-100 hover:border-primary-100 transition-all p-4 group shadow-sm bg-white"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 pt-0.5">
                                      <div className="w-7 h-7 rounded-md bg-slate-50 group-hover:bg-primary-50 flex items-center justify-center text-slate-400 group-hover:text-primary-600 font-black text-[11px] transition-colors border border-slate-100 group-hover:border-primary-100">
                                        {idx + 1}
                                      </div>
                                    </div>
                    
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="text-[13px] font-bold text-slate-800 leading-snug line-clamp-2">{question.text}</h3>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          <button
                                            onClick={() => {
                                              toggleQuestionVisibility(question.id, !question.isVisible);
                                              toast.success(question.isVisible ? 'Question hidden from students' : 'Question visible to students');
                                            }}
                                            className={`h-7 w-7 rounded-md flex items-center justify-center transition-all ${
                                              question.isVisible !== false
                                                ? 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
                                                : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'
                                            }`}
                                            title={question.isVisible !== false ? 'Visible to students – click to hide' : 'Hidden from students – click to show'}
                                          >
                                            {question.isVisible !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                                          </button>
                                          <button
                                            onClick={() => toggleQuickView(question.id)}
                                            className={`group h-7 w-7 rounded-md flex items-center justify-center transition-all ${
                                              quickView[question.id] 
                                                ? 'bg-primary-600 text-white shadow-md' 
                                                : 'text-slate-400 hover:text-primary-600 hover:bg-primary-50'
                                            }`}
                                            title={quickView[question.id] ? 'Close preview' : 'Open preview'}
                                          >
                                            <img
                                              src={previewIcon}
                                              alt={quickView[question.id] ? 'Close preview' : 'Open preview'}
                                              className={`w-3.5 h-3.5 transition-all ${
                                                quickView[question.id]
                                                  ? 'opacity-100 brightness-0 invert'
                                                  : 'opacity-70 grayscale group-hover:opacity-100 group-hover:grayscale-0'
                                              }`}
                                            />
                                          </button>
                                          <Link to={`/admin/edit/${question.id}`}>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 !p-0 text-slate-400 hover:text-primary-600">
                                              <Edit2 size={12} />
                                            </Button>
                                          </Link>
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => handleDeleteClick(question)}
                                            className="h-7 w-7 !p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                          >
                                            <Trash2 size={12} />
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Quick View Expanded Content */}
                                      {quickView[question.id] && (
                                        <div className="mt-4 mb-4 p-4 rounded-xl bg-slate-50 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                                          <div className="space-y-4">
                                            {/* Full Text */}
                                            <p className="text-xs font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">
                                              <span className="text-[10px] uppercase font-black text-primary-500 block mb-1">Question Body:</span>
                                              {question.text}
                                            </p>

                                            {/* Options Detail */}
                                            {(question.type === 'multiple-choice' || question.type === 'true-false') && (
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {question.options.map((opt, i) => (
                                                  <div 
                                                    key={i} 
                                                    className={`px-3 py-2 rounded-lg border flex items-center gap-2 text-[11px] font-bold ${
                                                      i === question.correctIndex 
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                                        : 'bg-white border-slate-100 text-slate-500'
                                                    }`}
                                                  >
                                                    <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black ${
                                                      i === question.correctIndex ? 'bg-emerald-500 text-white' : 'bg-slate-100'
                                                    }`}>
                                                      {i === question.correctIndex ? <CheckCircle size={10} /> : String.fromCharCode(65 + i)}
                                                    </div>
                                                    {opt}
                                                  </div>
                                                ))}
                                              </div>
                                            )}

                                            {/* Blank Detail */}
                                            {question.type === 'blank' && (
                                              <div className="px-3 py-2 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-700 text-[11px] font-bold flex items-center gap-2">
                                                <div className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center">
                                                   <CheckCircle size={10} />
                                                </div>
                                                <span className="text-[10px] uppercase font-black opacity-60">Correct Answer:</span>
                                                {question.correctAnswer}
                                              </div>
                                            )}

                                            {/* Explanation */}
                                            {question.explanation && (
                                              <div className="pt-3 border-t border-slate-200/60">
                                                 <p className="text-[11px] font-bold text-slate-500 italic">
                                                   <span className="text-[10px] uppercase font-black text-primary-400 block mb-1 not-italic">Teacher Notes & Explanation:</span>
                                                   "{question.explanation}"
                                                 </p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      
                                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Answer:</span>
                                          <div className="flex gap-1">
                                            {question.options.map((_, i) => (
                                              <div 
                                                key={i} 
                                                className={`w-3.5 h-1.5 rounded-full ${i === question.correctIndex ? 'bg-emerald-500' : 'bg-slate-100'}`}
                                              />
                                            ))}
                                          </div>
                                        </div>
                                        {question.explanation && (
                                          <div className="flex items-center gap-1 text-[9px] text-primary-500 font-black uppercase bg-primary-50/50 px-1.5 py-0.5 rounded border border-primary-50">
                                            <span>Explanation</span>
                                          </div>
                                        )}
                                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                                          question.difficulty === 'easy' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                          question.difficulty === 'hard' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                          'bg-amber-50 border-amber-100 text-amber-600'
                                        }`}>
                                          <Gauge size={10} />
                                          {question.difficulty || 'Medium'}
                                        </div>
                                        <div className="text-[9px] font-black uppercase text-slate-300 bg-slate-50/50 px-1.5 py-0.5 rounded border border-slate-50">
                                          {question.type?.replace('-', ' ') || 'multiple choice'}
                                        </div>
                                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                                          question.isVisible !== false
                                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                            : 'bg-slate-50 border-slate-200 text-slate-400'
                                        }`}>
                                          {question.isVisible !== false ? <Eye size={10} /> : <EyeOff size={10} />}
                                          {question.isVisible !== false ? 'Visible' : 'Hidden'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </Card>
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
