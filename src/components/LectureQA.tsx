import { ConfirmDialog } from './ui';
import {
  useLectureQA,
  QASkeleton,
  QATabs,
  ImageViewer,
  AskQuestionForm,
  ManualFAQForm,
  ChatThread,
  ThreadList,
  PublishedFAQ,
} from './lecture-qa';
import { lectureQAService, addTeacherReadTimestamp } from '../services/supabaseService';

interface LectureQAProps {
  lectureId: string;
  compact?: boolean;
  isAdminView?: boolean;
  initialThreadId?: string;
}

const LectureQA = ({ lectureId, compact = false, isAdminView = false, initialThreadId }: LectureQAProps) => {
  const qa = useLectureQA({ lectureId, isAdminView, initialThreadId });

  if (qa.isLoading) return <QASkeleton />;

  return (
    <div className={`space-y-6 ${compact ? 'mt-0' : 'sm:mt-12 mt-6'} pb-8`}>
      {/* Tabs */}
      <QATabs
        activeTab={qa.activeTab}
        onTabChange={(tab) => { qa.setActiveTab(tab); qa.setSelectedQuestionId(null); }}
      />

      {/* Student Ask Form */}
      {qa.activeTab === 'inbox' && !isAdminView && (
        <section className="space-y-5">
          <AskQuestionForm
            showForm={qa.showForm}
            setShowForm={qa.setShowForm}
            newQuestion={qa.newQuestion}
            setNewQuestion={qa.setNewQuestion}
            imagePreviews={qa.imagePreviews}
            selectedImages={qa.selectedImages}
            isUploading={qa.isUploading}
            onSubmit={qa.handleAsk}
            onImageSelect={qa.handleImageSelect}
            onRemoveImage={qa.removeImage}
            fileInputRef={qa.fileInputRef}
          />
        </section>
      )}

      {/* Admin Manual FAQ Entry */}
      {qa.activeTab === 'public' && isAdminView && (
        <section className="space-y-5">
          <ManualFAQForm
            showManualForm={qa.showManualForm}
            setShowManualForm={qa.setShowManualForm}
            manualData={qa.manualData}
            setManualData={qa.setManualData}
            onSubmit={qa.handleManualFAQ}
          />
        </section>
      )}

      {/* Inbox: Thread View or Thread List */}
      {qa.activeTab === 'inbox' && (() => {
        const list = qa.isMentor ? qa.questions : qa.myQs;
        if (list.length === 0 && !qa.isMentor) return null;

        if (qa.selectedQ) {
          return (
            <ChatThread
              selectedQ={qa.selectedQ}
              messages={qa.messages}
              isMentor={qa.isMentor}
              isAdminView={isAdminView}
              newMessage={qa.newMessage}
              setNewMessage={qa.setNewMessage}
              imagePreviews={qa.imagePreviews}
              selectedImages={qa.selectedImages}
              isUploading={qa.isUploading}
              editingMessageId={qa.editingMessageId}
              editingText={qa.editingText}
              menuOpenId={qa.menuOpenId}
              editingQuestionId={qa.editingQuestionId}
              editingQuestionText={qa.editingQuestionText}
              messagesEndRef={qa.messagesEndRef}
              fileInputRef={qa.fileInputRef}
              onBack={() => qa.setSelectedQuestionId(null)}
              onSendMsg={qa.handleSendMsg}
              onImageSelect={qa.handleImageSelect}
              onRemoveImage={qa.removeImage}
              onMenuToggle={qa.setMenuOpenId}
              onStartEditMessage={(id, text) => { qa.setEditingMessageId(id); qa.setEditingText(text); }}
              onCancelEditMessage={() => { qa.setEditingMessageId(null); qa.setEditingText(''); }}
              onSaveEditMessage={qa.handleEditMessage}
              onEditTextChange={qa.setEditingText}
              onDeleteMessageRequest={qa.setDeletingMsgId}
              onDeleteThreadRequest={qa.setDeletingId}
              onViewImage={qa.setViewingImage}
              onStartEditQuestion={(id, text) => { qa.setEditingQuestionId(id); qa.setEditingQuestionText(text); }}
              onCancelEditQuestion={() => qa.setEditingQuestionId(null)}
              onSaveEditQuestion={qa.handleEditQuestion}
              onEditQuestionTextChange={qa.setEditingQuestionText}
              parseImageUrls={qa.parseImageUrls}
            />
          );
        }

        return (
          <ThreadList
            list={list}
            isMentor={qa.isMentor}
            compact={compact}
            selectedQuestionId={qa.selectedQuestionId}
            onSelectThread={qa.setSelectedQuestionId}
            onMarkAsRead={(q) => {
              if (qa.isMentor && !q.is_read) {
                qa.setQuestions(prev => prev.map(item =>
                  item.id === q.id ? { ...item, is_read: true } : item
                ));
                addTeacherReadTimestamp(q.id);
                window.dispatchEvent(new CustomEvent('unread-count-changed', {
                  detail: { id: q.id, role: 'teacher' }
                }));
                lectureQAService.markAsRead(q.id)
                  .then(() => console.log('[Q&A] Marked thread as read from list click:', q.id))
                  .catch((err) => console.error('[Q&A] Failed to mark thread as read from list:', q.id, err));
              }
            }}
          />
        );
      })()}

      {/* Published FAQ */}
      {qa.activeTab === 'public' && qa.publishedQs.length > 0 && !qa.selectedQ && (
        <PublishedFAQ
          publishedQs={qa.publishedQs}
          isAdminView={isAdminView}
          onEdit={(q) => {
            qa.setManualData({
              id: q.id,
              question: q.question_text,
              answer: q.official_answer || '',
              publish: q.is_published
            });
            qa.setShowManualForm(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onTogglePublish={qa.handleTogglePublish}
          onDelete={qa.setDeletingId}
        />
      )}

      {/* Image Viewer */}
      {qa.viewingImage && (
        <ImageViewer src={qa.viewingImage} onClose={() => qa.setViewingImage(null)} />
      )}

      {/* Delete Message Confirmation */}
      <ConfirmDialog
        open={!!qa.deletingMsgId}
        title="Delete Message"
        message="Are you sure you want to delete this message? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={qa.handleDeleteMessage}
        onClose={() => qa.setDeletingMsgId(null)}
        confirmColor="rose"
      />

      {/* Delete Thread Confirmation */}
      <ConfirmDialog
        open={!!qa.deletingId}
        title="Confirm Delete"
        message="Are you sure you want to delete this? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={qa.handleDelete}
        onClose={() => qa.setDeletingId(null)}
        confirmColor="rose"
      />
    </div>
  );
};

export default LectureQA;
