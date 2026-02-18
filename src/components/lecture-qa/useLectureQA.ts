import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  lectureQAService,
  subscribeToLectureQuestions,
  subscribeToQuestionMessages,
  authService,
  addTeacherReadTimestamp,
  getTeacherReadMap
} from '../../services/supabaseService';
import { LectureQuestion, LectureQuestionMessage, Profile } from '../../lib/supabase';

const addTeacherReadId = addTeacherReadTimestamp;

export interface UseLectureQAOptions {
  lectureId: string;
  isAdminView?: boolean;
  initialThreadId?: string;
}

export function useLectureQA({ lectureId, isAdminView = false, initialThreadId }: UseLectureQAOptions) {
  const [questions, setQuestions] = useState<LectureQuestion[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LectureQuestionMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualData, setManualData] = useState({ id: '', question: '', answer: '', publish: true });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inbox' | 'public'>('inbox');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestionText, setEditingQuestionText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Precise mentor detection
  const isMentor = isAdminView || (profile
    ? (profile.role === 'teacher' || profile.role === 'admin')
    : localStorage.getItem('teacher_auth') === 'true');

  /* ── data helpers ── */
  const loadQuestions = useCallback(async () => {
    try {
      const rawQs = await lectureQAService.getQuestionsByLecture(lectureId);
      const sorted = rawQs.sort((a, b) => {
        const timeA = a.messages && a.messages.length > 0
          ? new Date(a.messages[a.messages.length - 1].created_at).getTime()
          : new Date(a.created_at).getTime();
        const timeB = b.messages && b.messages.length > 0
          ? new Date(b.messages[b.messages.length - 1].created_at).getTime()
          : new Date(b.created_at).getTime();
        return timeB - timeA;
      });

      const teacherRead = getTeacherReadMap();
      const adjusted = sorted.map(q => ({
        ...q,
        is_read: (teacherRead[q.id] && new Date(q.updated_at) <= new Date(teacherRead[q.id])) ? true : q.is_read
      }));

      setQuestions(adjusted);

      // Auto-select thread from notification click
      if (initialThreadId && !selectedQuestionId) {
        const found = sorted.find(q => q.id === initialThreadId);
        if (found) {
          setSelectedQuestionId(initialThreadId);
        }
      }
    } catch (e) {
      console.error('Error loading questions:', e);
    }
  }, [lectureId, initialThreadId, selectedQuestionId]);

  const loadMessages = useCallback(async (qid: string) => {
    try {
      const msgs = await lectureQAService.getMessagesByQuestion(qid);
      setMessages(msgs);
    } catch (e: any) {
      console.error('[DEBUG] Error loading messages for question:', qid, e);
      toast.error('Could not load chat history.');
    }
  }, []);

  /* ── init ── */
  useEffect(() => {
    const init = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        if (user) {
          try {
            const p = await authService.getProfile(user.id);
            setProfile(p);
          } catch (e) {
            console.error('Error loading profile:', e);
          }
        }
        await loadQuestions();
      } catch (e) {
        console.error('Error initializing Q&A:', e);
      } finally {
        setIsLoading(false);
      }
    };
    init();

    const qSub = subscribeToLectureQuestions(lectureId, (payload) => {
      loadQuestions();
      if (isAdminView && payload.eventType === 'INSERT') {
        // Toast removed per user request - centralized in sidebar/bell
      }
    });

    return () => { qSub.unsubscribe(); };
  }, [lectureId]);

  /* ── sync selected question ── */
  useEffect(() => {
    let mSub: any = null;

    if (selectedQuestionId) {
      const q = questions.find(q => q.id === selectedQuestionId);
      const isOwner = q?.student_id === currentUser?.id;

      if (isMentor || isOwner) {
        loadMessages(selectedQuestionId);

        if (isMentor && q && !q.is_read) {
          setQuestions(prev => prev.map(item =>
            item.id === selectedQuestionId ? { ...item, is_read: true } : item
          ));
          addTeacherReadId(selectedQuestionId);
          window.dispatchEvent(new CustomEvent('unread-count-changed', {
            detail: { id: selectedQuestionId, role: 'teacher' }
          }));
          lectureQAService.markAsRead(selectedQuestionId)
            .then(() => {
              console.log('[Q&A] Successfully marked thread as read:', selectedQuestionId);
              window.dispatchEvent(new CustomEvent('unread-count-changed', {
                detail: { id: selectedQuestionId, role: 'teacher' }
              }));
            })
            .catch((err) => {
              console.error('[Q&A] Failed to mark thread as read in backend:', selectedQuestionId, err);
            });
        }

        if (!isMentor && q && !q.is_read_by_student) {
          setQuestions(prev => prev.map(item => item.id === selectedQuestionId ? { ...item, is_read_by_student: true } : item));
          lectureQAService.markAsRead(selectedQuestionId, true).then(() => {
            window.dispatchEvent(new CustomEvent('unread-count-changed', {
              detail: { id: selectedQuestionId, role: 'student' }
            }));
          }).catch(console.error);
        }

        mSub = subscribeToQuestionMessages(selectedQuestionId, (payload) => {
          loadMessages(selectedQuestionId);
          if (payload.eventType === 'INSERT') {
            const isMyMsg = payload.new.sender_id === currentUser?.id;
            if (isMentor) {
              if (!isMyMsg) {
                setQuestions(prev => prev.map(i => i.id === selectedQuestionId ? { ...i, is_read: true } : i));
                addTeacherReadId(selectedQuestionId);
                window.dispatchEvent(new CustomEvent('unread-count-changed', { detail: { id: selectedQuestionId, role: 'teacher' } }));
                lectureQAService.markAsRead(selectedQuestionId).catch(console.error);
              }
            } else {
              if (!isMyMsg) {
                setQuestions(prev => prev.map(i => i.id === selectedQuestionId ? { ...i, is_read_by_student: true } : i));
                window.dispatchEvent(new CustomEvent('unread-count-changed', { detail: { id: selectedQuestionId, role: 'student' } }));
                lectureQAService.markAsRead(selectedQuestionId, true).catch(console.error);
              }
            }
          }
        });
      } else {
        setMessages([]);
      }
    }

    return () => {
      if (mSub) mSub.unsubscribe();
    };
  }, [selectedQuestionId, profile, currentUser, questions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── image helpers ── */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: File[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        newFiles.push(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
    setSelectedImages(prev => [...prev, ...newFiles]);
    if (e.target) e.target.value = '';
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearSelectedImages = () => {
    setSelectedImages([]);
    setImagePreviews([]);
  };

  /* ── actions ── */
  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() && selectedImages.length === 0) return;
    try {
      setIsUploading(true);
      const result = await lectureQAService.createQuestion(lectureId, newQuestion || 'Question with photo');
      setNewQuestion('');
      setShowForm(false);
      if (result?.id) {
        if (selectedImages.length > 0) {
          const urls: string[] = [];
          for (const img of selectedImages) {
            urls.push(await lectureQAService.uploadChatImage(img));
          }
          await lectureQAService.sendMessage(result.id, '📷 Photo', false, urls);
        }
        clearSelectedImages();
        setSelectedQuestionId(result.id);
        await loadMessages(result.id);
      }
      loadQuestions();
      window.dispatchEvent(new CustomEvent('unread-count-changed', {
        detail: { id: result.id, role: 'student' }
      }));
      toast.success('Question sent to your mentor.');
    } catch (e: any) {
      console.error('Error creating question:', e);
      toast.error(`Failed to send: ${e.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualData.question.trim() || !manualData.answer.trim()) return;
    try {
      if (manualData.id) {
        await lectureQAService.updateOfficialAnswer(manualData.id, manualData.answer);
        await lectureQAService.togglePublishQuestion(manualData.id, manualData.publish);
      } else {
        await lectureQAService.createQuestion(lectureId, manualData.question, manualData.publish, manualData.answer);
      }
      setManualData({ id: '', question: '', answer: '', publish: true });
      setShowManualForm(false);
      loadQuestions();
      toast.success(manualData.id ? 'FAQ updated.' : 'Manual FAQ entry added.');
    } catch (e) {
      console.error('Error in manual FAQ action:', e);
      toast.error('Operation failed.');
    }
  };

  const handleSendMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && selectedImages.length === 0) || !selectedQuestionId) return;
    try {
      setIsUploading(true);
      const uploadedUrls: string[] = [];
      if (selectedImages.length > 0) {
        try {
          for (const img of selectedImages) {
            const url = await lectureQAService.uploadChatImage(img);
            uploadedUrls.push(url);
          }
        } catch (uploadError: any) {
          console.error('[Q&A] Image upload failed:', uploadError);
          toast.error(`Failed to upload image: ${uploadError.message || 'Unknown error'}`);
          setIsUploading(false);
          return;
        }
      }
      const text = newMessage.trim() || (uploadedUrls.length > 0 ? '📷 Photo' : '');
      try {
        await lectureQAService.sendMessage(selectedQuestionId, text, isMentor, uploadedUrls.length > 0 ? uploadedUrls : undefined);
      } catch (sendError: any) {
        console.error('[Q&A] Failed to send message:', sendError);
        toast.error(`Failed to send message: ${sendError.message || 'Unknown error'}`);
        setIsUploading(false);
        return;
      }
      setNewMessage('');
      clearSelectedImages();

      if (isMentor) {
        setQuestions(prev => prev.map(q =>
          q.id === selectedQuestionId ? { ...q, is_read: true, is_read_by_student: false } : q
        ));
        addTeacherReadId(selectedQuestionId);
        window.dispatchEvent(new CustomEvent('unread-count-changed', {
          detail: { id: selectedQuestionId, role: 'teacher' }
        }));
        lectureQAService.markAsRead(selectedQuestionId)
          .then(() => {
            console.log('[Q&A] Thread marked as read after teacher sent message:', selectedQuestionId);
            window.dispatchEvent(new CustomEvent('unread-count-changed', {
              detail: { id: selectedQuestionId, role: 'teacher' }
            }));
          })
          .catch((err) => {
            console.error('[Q&A] Failed to mark thread as read after sending message:', selectedQuestionId, err);
          });
      }
      await loadMessages(selectedQuestionId);
      toast.success(uploadedUrls.length > 0 ? 'Message with images sent successfully!' : 'Message sent successfully!');
    } catch (e: any) {
      console.error('[Q&A] Unexpected error sending message:', e);
      toast.error(`Failed to send message: ${e.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editingText.trim()) return;
    const savedText = editingText;
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, message_text: savedText } : m));
    setEditingMessageId(null);
    setEditingText('');
    try {
      await lectureQAService.editMessage(messageId, savedText);
      if (selectedQuestionId) await loadMessages(selectedQuestionId);
      toast.success('Message updated.');
    } catch (e: any) {
      console.error('Error editing message:', e);
      if (selectedQuestionId) await loadMessages(selectedQuestionId);
      toast.error(e?.message || 'Failed to edit message.');
    }
  };

  const handleDeleteMessage = async () => {
    if (!deletingMsgId) return;
    try {
      await lectureQAService.deleteMessage(deletingMsgId);
      setDeletingMsgId(null);
      if (selectedQuestionId) await loadMessages(selectedQuestionId);
      toast.success('Message deleted.');
    } catch (e) {
      console.error('Error deleting message:', e);
      toast.error('Failed to delete message.');
    }
  };

  const handleEditQuestion = async (questionId: string) => {
    if (!editingQuestionText.trim()) return;
    try {
      await lectureQAService.editQuestion(questionId, editingQuestionText);
      setEditingQuestionId(null);
      setEditingQuestionText('');
      loadQuestions();
      toast.success('Question updated.');
    } catch (e) {
      console.error('Error editing question:', e);
      toast.error('Failed to edit question.');
    }
  };

  const parseImageUrls = (imageUrl: string | null | undefined): string[] => {
    if (!imageUrl) return [];
    try {
      if (imageUrl.startsWith('[')) {
        return JSON.parse(imageUrl);
      }
    } catch {}
    return [imageUrl];
  };

  const handleTogglePublish = async (qid: string, published: boolean) => {
    try {
      await lectureQAService.togglePublishQuestion(qid, !published);
      loadQuestions();
      toast.success(published ? 'Unpublished successfully' : 'Published successfully');
    } catch (e) {
      console.error('Error toggling publish:', e);
      toast.error('Failed to update status.');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await lectureQAService.deleteQuestion(deletingId);
      if (selectedQuestionId === deletingId) setSelectedQuestionId(null);
      setDeletingId(null);
      loadQuestions();
      window.dispatchEvent(new CustomEvent('unread-count-changed', {
        detail: { id: deletingId, role: isMentor ? 'teacher' : 'student' }
      }));
      toast.success('Deleted successfully');
    } catch (e) {
      console.error('Error deleting question:', e);
      toast.error('Failed to delete.');
    }
  };

  // Derived data
  const selectedQ = questions.find(q => q.id === selectedQuestionId) || null;
  const publishedQs = questions.filter(q => q.is_published);
  const myQs = currentUser
    ? questions.filter(q => q.student_id === currentUser.id)
    : questions;

  return {
    // State
    questions, currentUser, profile, newQuestion, selectedQuestionId, messages,
    newMessage, isLoading, showForm, showManualForm, manualData, deletingId,
    activeTab, selectedImages, imagePreviews, isUploading, viewingImage,
    editingMessageId, editingText, deletingMsgId, menuOpenId,
    editingQuestionId, editingQuestionText,
    // Refs
    messagesEndRef, fileInputRef,
    // Computed
    isMentor, selectedQ, publishedQs, myQs,
    // Setters
    setNewQuestion, setSelectedQuestionId, setNewMessage, setShowForm,
    setShowManualForm, setManualData, setDeletingId, setActiveTab,
    setViewingImage, setEditingMessageId, setEditingText, setDeletingMsgId,
    setMenuOpenId, setEditingQuestionId, setEditingQuestionText, setQuestions,
    // Actions
    handleAsk, handleManualFAQ, handleImageSelect, removeImage, clearSelectedImages,
    handleSendMsg, handleEditMessage, handleDeleteMessage, handleEditQuestion,
    parseImageUrls, handleTogglePublish, handleDelete,
    // Helpers
    addTeacherReadId: addTeacherReadTimestamp,
    loadQuestions,
  };
}
