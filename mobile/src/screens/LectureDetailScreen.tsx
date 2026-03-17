import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/app';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { lectureQAApi } from '../api/lectureQAApi';
import { subscribeToLectureQuestions, subscribeToQuestionMessages } from '../services/realtimeService';
import { formatRelativeTime } from '../utils/format';

type Tab = 'overview' | 'materials' | 'questions' | 'chat';

const LectureDetailScreen = ({ route, navigation }: any) => {
  const { lectureId, threadId } = route.params;
  const { user } = useAuth();
  const { lectures, getQuestionsByLecture, getMaterialsByLecture } = useData();

  const lecture = lectures.find(l => l.id === lectureId);
  const questions = getQuestionsByLecture(lectureId);
  const materials = getMaterialsByLecture(lectureId);

  const [activeTab, setActiveTab] = useState<Tab>(threadId ? 'chat' : 'overview');
  const [qaThreads, setQaThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Fetch Q&A threads
  const fetchThreads = useCallback(async () => {
    try {
      const threads = await lectureQAApi.getQuestionsByLecture(lectureId);
      setQaThreads(threads);
      if (threadId) {
        const target = threads.find((t: any) => t.id === threadId);
        if (target) openThread(target);
      }
    } catch (e) {
      console.error('Error fetching threads:', e);
    }
  }, [lectureId, threadId]);

  useEffect(() => {
    fetchThreads();
    const sub = subscribeToLectureQuestions(lectureId, () => fetchThreads());
    return () => { sub.unsubscribe(); };
  }, [lectureId, fetchThreads]);

  const openThread = async (thread: any) => {
    setSelectedThread(thread);
    setLoadingChat(true);
    try {
      const msgs = await lectureQAApi.getMessagesByQuestion(thread.id);
      setMessages(msgs);
      // Mark as read for student
      if (user && thread.student_id === user.id && !thread.is_read_by_student) {
        await lectureQAApi.markAsRead(thread.id, true);
      }
    } catch (e) {
      console.error('Error loading messages:', e);
    } finally {
      setLoadingChat(false);
    }
  };

  // Subscribe to message updates for selected thread
  useEffect(() => {
    if (!selectedThread) return;
    const sub = subscribeToQuestionMessages(selectedThread.id, async () => {
      try {
        const msgs = await lectureQAApi.getMessagesByQuestion(selectedThread.id);
        setMessages(msgs);
      } catch { /* ignore */ }
    });
    return () => { sub.unsubscribe(); };
  }, [selectedThread?.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || sending) return;
    setSending(true);
    try {
      await lectureQAApi.sendMessage(selectedThread.id, newMessage.trim(), false);
      setNewMessage('');
      const msgs = await lectureQAApi.getMessagesByQuestion(selectedThread.id);
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!newQuestion.trim() || sending) return;
    setSending(true);
    try {
      const thread = await lectureQAApi.createQuestion(lectureId, newQuestion.trim());
      setNewQuestion('');
      await fetchThreads();
      openThread(thread);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to ask question');
    } finally {
      setSending(false);
    }
  };

  if (!lecture) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Lecture not found</Text>
      </View>
    );
  }

  const renderOverview = () => (
    <View style={styles.tabContent}>
      <Text style={styles.lectureTitle}>{lecture.title}</Text>
      {lecture.description ? (
        <Text style={styles.lectureDesc}>{lecture.description}</Text>
      ) : null}

      {lecture.sections?.length > 0 && (
        <View style={styles.sectionBlock}>
          <Text style={styles.blockTitle}>Sections</Text>
          {lecture.sections.map((section: string, idx: number) => (
            <View key={idx} style={styles.sectionItem}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionText}>{section}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.overviewStats}>
        <View style={styles.overviewStat}>
          <Ionicons name="help-circle" size={16} color={COLORS.violet[500]} />
          <Text style={styles.overviewStatText}>{questions.length} Questions</Text>
        </View>
        <View style={styles.overviewStat}>
          <Ionicons name="document-text" size={16} color={COLORS.emerald[500]} />
          <Text style={styles.overviewStatText}>{materials.length} Materials</Text>
        </View>
        <View style={styles.overviewStat}>
          <Ionicons name="chatbubbles" size={16} color={COLORS.primary[500]} />
          <Text style={styles.overviewStatText}>{qaThreads.length} Chats</Text>
        </View>
      </View>
    </View>
  );

  const renderMaterials = () => (
    <View style={styles.tabContent}>
      {materials.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={28} color={COLORS.slate[300]} />
          <Text style={styles.emptyTitle}>No materials yet</Text>
        </View>
      ) : (
        materials.map(material => (
          <TouchableOpacity
            key={material.id}
            style={styles.materialCard}
            onPress={() => {
              if (material.fileUrl) Linking.openURL(material.fileUrl);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.materialIcon, {
              backgroundColor: material.fileType === 'pdf' ? COLORS.rose[50] :
                material.fileType === 'word' ? COLORS.primary[50] : COLORS.emerald[50],
            }]}>
              <Ionicons
                name={material.fileType === 'pdf' ? 'document' : material.fileType === 'word' ? 'document-text' : 'create'}
                size={18}
                color={material.fileType === 'pdf' ? COLORS.rose[500] :
                  material.fileType === 'word' ? COLORS.primary[500] : COLORS.emerald[500]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.materialTitle} numberOfLines={1}>{material.title}</Text>
              <Text style={styles.materialType}>{material.fileType.toUpperCase()}</Text>
            </View>
            {material.fileUrl && (
              <Ionicons name="download-outline" size={18} color={COLORS.slate[400]} />
            )}
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderQuestions = () => (
    <View style={styles.tabContent}>
      {questions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="help-circle-outline" size={28} color={COLORS.slate[300]} />
          <Text style={styles.emptyTitle}>No questions yet</Text>
        </View>
      ) : (
        questions.map((q, idx) => (
          <View key={q.id} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.qBadge}>
                <Text style={styles.qBadgeText}>Q{idx + 1}</Text>
              </View>
              <View style={[styles.diffBadge, {
                backgroundColor: q.difficulty === 'easy' ? COLORS.emerald[50] :
                  q.difficulty === 'medium' ? COLORS.amber[50] : COLORS.rose[50],
              }]}>
                <Text style={[styles.diffText, {
                  color: q.difficulty === 'easy' ? COLORS.emerald[600] :
                    q.difficulty === 'medium' ? COLORS.amber[600] : COLORS.rose[500],
                }]}>{q.difficulty}</Text>
              </View>
            </View>
            <Text style={styles.questionText}>{q.text}</Text>
            {q.options?.length > 0 && (
              <View style={styles.optionsList}>
                {q.options.map((opt: string, oi: number) => (
                  <View key={oi} style={styles.optionItem}>
                    <View style={[styles.optionCircle, q.correctIndex === oi && styles.optionCorrect]}>
                      <Text style={[styles.optionLetter, q.correctIndex === oi && { color: COLORS.white }]}>
                        {String.fromCharCode(65 + oi)}
                      </Text>
                    </View>
                    <Text style={styles.optionText}>{opt}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderChat = () => {
    if (selectedThread) {
      return (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}
        >
          {/* Thread Header */}
          <TouchableOpacity style={styles.threadHeader} onPress={() => setSelectedThread(null)}>
            <Ionicons name="arrow-back" size={20} color={COLORS.primary[600]} />
            <Text style={styles.threadHeaderTitle} numberOfLines={1}>
              {selectedThread.question_text.substring(0, 50)}...
            </Text>
          </TouchableOpacity>

          {loadingChat ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={COLORS.primary[500]} />
            </View>
          ) : (
            <ScrollView
              ref={scrollRef}
              style={styles.messagesContainer}
              contentContainerStyle={{ padding: 16, gap: 8 }}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            >
              {/* Original question */}
              <View style={styles.questionBubble}>
                <Text style={styles.questionBubbleText}>{selectedThread.question_text}</Text>
                <Text style={styles.bubbleTime}>{formatRelativeTime(selectedThread.created_at)}</Text>
              </View>

              {messages.map(msg => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <View key={msg.id} style={[styles.msgBubble, isMe ? styles.msgMe : styles.msgOther]}>
                    {!isMe && (
                      <Text style={styles.senderName}>
                        {msg.sender?.full_name || 'Teacher'}
                      </Text>
                    )}
                    <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
                      {msg.message_text}
                    </Text>
                    <Text style={[styles.bubbleTime, isMe && { color: 'rgba(255,255,255,0.6)' }]}>
                      {formatRelativeTime(msg.created_at)}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Message Input */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.msgInput}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.slate[400]}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!newMessage.trim() || sending) && { opacity: 0.5 }]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="send" size={18} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      );
    }

    // Thread list
    return (
      <View style={styles.tabContent}>
        {/* Ask new question */}
        <View style={styles.askBox}>
          <TextInput
            style={styles.askInput}
            placeholder="Ask a question about this lecture..."
            placeholderTextColor={COLORS.slate[400]}
            value={newQuestion}
            onChangeText={setNewQuestion}
            multiline
          />
          <TouchableOpacity
            style={[styles.askBtn, (!newQuestion.trim() || sending) && { opacity: 0.5 }]}
            onPress={handleAskQuestion}
            disabled={!newQuestion.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="send" size={14} color={COLORS.white} />
                <Text style={styles.askBtnText}>Ask</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {qaThreads.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="chatbubbles-outline" size={28} color={COLORS.slate[300]} />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySub}>Ask a question to start a conversation</Text>
          </View>
        ) : (
          qaThreads
            .filter((t: any) => t.student_id === user?.id)
            .map((thread: any) => {
              const msgCount = thread.messages?.length || 0;
              const isUnread = !thread.is_read_by_student;

              return (
                <TouchableOpacity
                  key={thread.id}
                  style={[styles.chatThreadCard, isUnread && styles.chatThreadUnread]}
                  onPress={() => openThread(thread)}
                  activeOpacity={0.7}
                >
                  <View style={styles.chatThreadTop}>
                    <Text style={styles.chatThreadQ} numberOfLines={2}>{thread.question_text}</Text>
                    {isUnread && <View style={styles.unreadDot} />}
                  </View>
                  <View style={styles.chatThreadBottom}>
                    <Text style={styles.chatThreadMeta}>{msgCount} message{msgCount !== 1 ? 's' : ''}</Text>
                    <Text style={styles.chatThreadTime}>{formatRelativeTime(thread.updated_at)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
        )}
      </View>
    );
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: 'information-circle-outline' },
    { key: 'materials', label: 'Materials', icon: 'document-text-outline' },
    { key: 'questions', label: 'Quiz', icon: 'help-circle-outline' },
    { key: 'chat', label: 'Chat', icon: 'chatbubbles-outline' },
  ];

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => { setActiveTab(tab.key); setSelectedThread(null); }}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? COLORS.primary[600] : COLORS.slate[400]}
            />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'chat' ? (
        <View style={{ flex: 1 }}>{renderChat()}</View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'materials' && renderMaterials()}
          {activeTab === 'questions' && renderQuestions()}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate[50] },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate[200],
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.primary[600] },
  tabLabel: { fontSize: 12, fontWeight: '600', color: COLORS.slate[400] },
  tabLabelActive: { color: COLORS.primary[600] },
  tabContent: { padding: 16, gap: 12 },
  lectureTitle: { fontSize: 22, fontWeight: '900', color: COLORS.slate[900] },
  lectureDesc: { fontSize: 14, color: COLORS.slate[500], lineHeight: 21, marginTop: 4 },
  sectionBlock: { marginTop: 16 },
  blockTitle: { fontSize: 14, fontWeight: '700', color: COLORS.slate[900], marginBottom: 10 },
  sectionItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary[400] },
  sectionText: { fontSize: 14, color: COLORS.slate[700] },
  overviewStats: { flexDirection: 'row', gap: 12, marginTop: 20 },
  overviewStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  overviewStatText: { fontSize: 12, fontWeight: '600', color: COLORS.slate[600] },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: COLORS.slate[500] },
  emptySub: { fontSize: 12, color: COLORS.slate[400] },
  materialCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  materialIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialTitle: { fontSize: 14, fontWeight: '600', color: COLORS.slate[900] },
  materialType: { fontSize: 11, color: COLORS.slate[400], marginTop: 2, fontWeight: '500' },
  questionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    padding: 16,
  },
  questionHeader: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  qBadge: {
    backgroundColor: COLORS.violet[50],
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  qBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.violet[600] },
  diffBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  diffText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  questionText: { fontSize: 14, fontWeight: '600', color: COLORS.slate[900], lineHeight: 21 },
  optionsList: { marginTop: 12, gap: 8 },
  optionItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCorrect: { backgroundColor: COLORS.emerald[500] },
  optionLetter: { fontSize: 12, fontWeight: '700', color: COLORS.slate[600] },
  optionText: { fontSize: 13, color: COLORS.slate[700], flex: 1 },
  // Chat styles
  askBox: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    padding: 12,
  },
  askInput: {
    fontSize: 14,
    color: COLORS.slate[900],
    minHeight: 44,
    maxHeight: 80,
    textAlignVertical: 'top',
  },
  askBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary[600],
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
    marginTop: 8,
  },
  askBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  chatThreadCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    padding: 14,
  },
  chatThreadUnread: { borderColor: COLORS.primary[200], backgroundColor: COLORS.primary[50] },
  chatThreadTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  chatThreadQ: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.slate[900], lineHeight: 20 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary[500], marginTop: 4 },
  chatThreadBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  chatThreadMeta: { fontSize: 12, color: COLORS.slate[400] },
  chatThreadTime: { fontSize: 12, color: COLORS.slate[400] },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate[200],
    padding: 12,
  },
  threadHeaderTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.slate[900] },
  messagesContainer: { flex: 1, backgroundColor: COLORS.slate[50] },
  questionBubble: {
    backgroundColor: COLORS.violet[50],
    borderRadius: 14,
    padding: 14,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  questionBubbleText: { fontSize: 14, color: COLORS.violet[700], lineHeight: 20, fontWeight: '500' },
  bubbleTime: { fontSize: 10, color: COLORS.slate[400], marginTop: 6 },
  msgBubble: {
    borderRadius: 14,
    padding: 12,
    maxWidth: '80%',
  },
  msgMe: {
    backgroundColor: COLORS.primary[600],
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  msgOther: {
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
  },
  senderName: { fontSize: 11, fontWeight: '700', color: COLORS.primary[600], marginBottom: 4 },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTextMe: { color: COLORS.white },
  msgTextOther: { color: COLORS.slate[900] },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate[200],
    padding: 10,
    gap: 8,
  },
  msgInput: {
    flex: 1,
    backgroundColor: COLORS.slate[50],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.slate[900],
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LectureDetailScreen;
