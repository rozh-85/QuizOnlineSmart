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
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../constants/app';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { lectureQAApi } from '../api/lectureQAApi';
import { subscribeToLectureQuestions, subscribeToQuestionMessages } from '../services/realtimeService';
import { formatRelativeTime } from '../utils/format';

type Tab = 'overview' | 'materials' | 'questions' | 'chat';
const MESSAGE_LOAD_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Message loading timed out. Tap to retry.'));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
}

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
  const [messageError, setMessageError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const initialThreadOpenedRef = useRef(false);
  const messageRequestRef = useRef(0);
  const loadingRequestRef = useRef(0);

  const parseImageUrls = useCallback((imageUrl: string | null | undefined) => {
    if (!imageUrl) return [];
    try {
      if (imageUrl.startsWith('[')) {
        const parsed = JSON.parse(imageUrl);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      }
    } catch { /* fall through to single URL */ }
    return [imageUrl];
  }, []);

  const clearComposer = useCallback(() => {
    setNewMessage('');
    setSelectedImages([]);
  }, []);

  const handlePickImages = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow photo access to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 4,
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImages(prev => [...prev, ...result.assets].slice(0, 4));
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not open image picker.');
    }
  }, []);

  const removeSelectedImage = useCallback((index: number) => {
    setSelectedImages(prev => prev.filter((_, idx) => idx !== index));
  }, []);

  const loadMessagesForThread = useCallback(async (questionId: string, showLoading = false) => {
    const requestId = ++messageRequestRef.current;

    if (showLoading) {
      loadingRequestRef.current = requestId;
      setLoadingChat(true);
      setMessageError(null);
    }

    try {
      const msgs = await withTimeout(
        lectureQAApi.getMessagesByQuestion(questionId),
        MESSAGE_LOAD_TIMEOUT_MS
      );

      if (messageRequestRef.current === requestId) {
        setMessages(msgs);
        setMessageError(null);
        setLoadingChat(false);
        loadingRequestRef.current = 0;
      }
    } catch (e: any) {
      console.error('Error loading messages:', e);
      if (messageRequestRef.current === requestId || loadingRequestRef.current === requestId) {
        setMessageError(e?.message || 'Could not load chat messages.');
      }
    } finally {
      if (loadingRequestRef.current === requestId && showLoading) {
        setLoadingChat(false);
        loadingRequestRef.current = 0;
      }
    }
  }, []);

  const openThread = useCallback((thread: any) => {
    setSelectedThread(thread);
    setMessages([]);
    loadMessagesForThread(thread.id, true);

    // Mark as read in the background so a slow update cannot keep the spinner up.
    if (user && thread.student_id === user.id && !thread.is_read_by_student) {
      setQaThreads(prev => prev.map(t =>
        t.id === thread.id ? { ...t, is_read_by_student: true } : t
      ));
      lectureQAApi.markAsRead(thread.id, true).catch(e => {
        console.error('Error marking thread as read:', e);
      });
    }
  }, [loadMessagesForThread, user?.id]);

  // Fetch Q&A threads
  const fetchThreads = useCallback(async () => {
    try {
      const threads = await lectureQAApi.getQuestionsByLecture(lectureId);
      setQaThreads(threads);

      // When opened from the chat notification tab, select that thread once.
      if (threadId && !initialThreadOpenedRef.current) {
        const target = threads.find((t: any) => t.id === threadId);
        if (target) {
          initialThreadOpenedRef.current = true;
          openThread(target);
        }
      }
    } catch (e) {
      console.error('Error fetching threads:', e);
    }
  }, [lectureId, threadId, openThread]);

  useEffect(() => {
    initialThreadOpenedRef.current = false;
  }, [lectureId, threadId]);

  useEffect(() => {
    fetchThreads();
    const sub = subscribeToLectureQuestions(lectureId, () => fetchThreads());
    return () => { sub.unsubscribe(); };
  }, [lectureId, fetchThreads]);

  // Subscribe to message updates for selected thread
  useEffect(() => {
    if (!selectedThread) return;
    const sub = subscribeToQuestionMessages(selectedThread.id, (payload: any) => {
      loadMessagesForThread(selectedThread.id);

      const isMyMessage = payload?.new?.sender_id === user?.id;
      if (payload?.eventType === 'INSERT' && !isMyMessage) {
        lectureQAApi.markAsRead(selectedThread.id, true).catch(e => {
          console.error('Error marking new message as read:', e);
        });
      }
    });

    const pollInterval = setInterval(() => {
      loadMessagesForThread(selectedThread.id);
    }, 5000);

    return () => {
      sub.unsubscribe();
      clearInterval(pollInterval);
    };
  }, [selectedThread?.id, loadMessagesForThread, user?.id]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedImages.length === 0) || !selectedThread || sending) return;
    setSending(true);
    try {
      const imageUrls: string[] = [];
      for (const image of selectedImages) {
        imageUrls.push(await lectureQAApi.uploadChatImage(image));
      }

      const text = newMessage.trim() || 'Photo';
      await lectureQAApi.sendMessage(
        selectedThread.id,
        text,
        false,
        imageUrls.length > 0 ? imageUrls : undefined
      );
      clearComposer();
      await loadMessagesForThread(selectedThread.id);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const startEditMessage = (message: any) => {
    if (message.sender_id !== user?.id) return;
    setEditingMessageId(message.id);
    setEditingText(message.message_text === 'Photo' ? '' : message.message_text);
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const saveEditMessage = async (messageId: string) => {
    const nextText = editingText.trim();
    if (!nextText) {
      Alert.alert('Error', 'Message cannot be empty.');
      return;
    }

    const previous = messages;
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, message_text: nextText } : msg
    ));
    cancelEditMessage();

    try {
      await lectureQAApi.editMessage(messageId, nextText);
      if (selectedThread) await loadMessagesForThread(selectedThread.id);
    } catch (e: any) {
      setMessages(previous);
      Alert.alert('Error', e?.message || 'Failed to edit message.');
    }
  };

  const confirmDeleteMessage = (messageId: string) => {
    Alert.alert('Delete message', 'Delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const previous = messages;
          setMessages(prev => prev.filter(msg => msg.id !== messageId));
          try {
            await lectureQAApi.deleteMessage(messageId);
            if (selectedThread) await loadMessagesForThread(selectedThread.id);
          } catch (e: any) {
            setMessages(previous);
            Alert.alert('Error', e?.message || 'Failed to delete message.');
          }
        },
      },
    ]);
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

  const renderOverview = () => {
    const totalQuestions = questions.length;
    const estimatedMin = Math.ceil(totalQuestions * 0.5);

    return (
      <View style={styles.tabContent}>
        {/* ── Chapter Overview Card (matches web QuizStart) ── */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewCardTop}>
            <View style={styles.overviewIcon}>
              <Ionicons name="book-outline" size={20} color={COLORS.primary[600]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.lectureTitle}>{lecture.title}</Text>
              {lecture.description ? (
                <Text style={styles.lectureDesc}>{lecture.description}</Text>
              ) : null}
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.overviewStatsRow}>
            <View style={styles.overviewStatItem}>
              <Text style={styles.overviewStatValue}>{totalQuestions}</Text>
              <Text style={styles.overviewStatLabel}>Questions</Text>
            </View>
            <View style={styles.overviewStatDivider} />
            <View style={styles.overviewStatItem}>
              <Text style={styles.overviewStatValue}>~{estimatedMin}m</Text>
              <Text style={styles.overviewStatLabel}>Duration</Text>
            </View>
          </View>

          {/* Start Quiz button */}
          <TouchableOpacity
            style={styles.startQuizBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Quiz', { lectureId })}
          >
            <Ionicons name="play" size={15} color={COLORS.white} />
            <Text style={styles.startQuizBtnText}>Start Quiz</Text>
          </TouchableOpacity>
        </View>

        {/* ── Sections Grid ── */}
        {lecture.sections?.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.blockTitle}>Sections</Text>
            {lecture.sections.map((section: string, idx: number) => {
              const sectionQCount = questions.filter(q => q.sectionId === section).length;
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.sectionCard}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('Quiz', { lectureId, section })}
                >
                  <View style={styles.sectionCardIcon}>
                    <Ionicons name="book-outline" size={16} color={COLORS.slate[400]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionCardTitle}>{section}</Text>
                    <Text style={styles.sectionCardSub}>{sectionQCount} questions</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Learning Materials ── */}
        {materials.length > 0 && (
          <View style={styles.materialsBlock}>
            <View style={styles.materialsHeader}>
              <View style={styles.materialsHeaderIcon}>
                <Ionicons name="document-text" size={20} color={COLORS.primary[600]} />
              </View>
              <View>
                <Text style={styles.materialsHeaderTitle}>Learning Materials</Text>
                <Text style={styles.materialsHeaderSub}>Study these notes before starting the quiz</Text>
              </View>
            </View>
            {materials.map(material => (
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
                  <Text style={styles.materialType}>
                    {material.fileType === 'note' ? 'LECTURE NOTE' : material.fileType.toUpperCase()}
                  </Text>
                  {material.fileType === 'note' && material.content ? (
                    <View style={styles.noteContent}>
                      <Text style={styles.noteContentText} numberOfLines={4}>{material.content}</Text>
                    </View>
                  ) : material.fileUrl ? (
                    <View style={styles.materialLink}>
                      <Ionicons name="link" size={14} color={COLORS.primary[600]} />
                      <Text style={styles.materialLinkText} numberOfLines={1}>
                        {material.fileName || 'Open Document'}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={COLORS.primary[600]} />
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

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
            <View style={styles.materialBody}>
              <Text style={styles.materialTitle} numberOfLines={1}>{material.title}</Text>
              <Text style={styles.materialType}>
                {material.fileType === 'note' ? 'LECTURE NOTE' : material.fileType.toUpperCase()}
              </Text>
              {material.fileType === 'note' && material.content ? (
                <View style={styles.noteContent}>
                  <Text style={styles.noteContentText} numberOfLines={6}>{material.content}</Text>
                </View>
              ) : null}
            </View>
            {material.fileType !== 'note' && material.fileUrl && (
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
          <TouchableOpacity
            style={styles.threadHeader}
            onPress={() => {
              setSelectedThread(null);
              setMessages([]);
              setMessageError(null);
              setSelectedImages([]);
              cancelEditMessage();
            }}
          >
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
            <View style={{ flex: 1 }}>
              {messageError ? (
                <TouchableOpacity
                  style={styles.chatError}
                  activeOpacity={0.8}
                  onPress={() => loadMessagesForThread(selectedThread.id, true)}
                >
                  <Ionicons name="refresh" size={16} color={COLORS.rose[500]} />
                  <Text style={styles.chatErrorText}>{messageError}</Text>
                </TouchableOpacity>
              ) : null}

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
                  const imageUrls = parseImageUrls(msg.image_url);
                  const isEditing = editingMessageId === msg.id;
                  const showText = msg.message_text && !(msg.message_text === 'Photo' && imageUrls.length > 0);
                  return (
                    <TouchableOpacity
                      key={msg.id}
                      activeOpacity={0.9}
                      onLongPress={() => isMe && startEditMessage(msg)}
                      style={[styles.msgBubble, isMe ? styles.msgMe : styles.msgOther]}
                    >
                      {!isMe && (
                        <Text style={styles.senderName}>
                          {msg.sender?.full_name || 'Teacher'}
                        </Text>
                      )}

                      {imageUrls.length > 0 ? (
                        <View style={imageUrls.length > 1 ? styles.msgImageGrid : undefined}>
                          {imageUrls.map((url: string, idx: number) => (
                            <TouchableOpacity
                              key={`${url}-${idx}`}
                              activeOpacity={0.85}
                              onPress={() => setViewingImageUrl(url)}
                            >
                              <Image
                                source={{ uri: url }}
                                style={imageUrls.length > 1 ? styles.msgImageSmall : styles.msgImage}
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : null}

                      {isEditing ? (
                        <View style={styles.editBox}>
                          <TextInput
                            style={[styles.editInput, isMe && styles.editInputMe]}
                            value={editingText}
                            onChangeText={setEditingText}
                            placeholder="Edit message..."
                            placeholderTextColor={isMe ? 'rgba(255,255,255,0.6)' : COLORS.slate[400]}
                            multiline
                            autoFocus
                          />
                          <View style={styles.editActions}>
                            <TouchableOpacity style={styles.editActionBtn} onPress={cancelEditMessage}>
                              <Text style={[styles.editActionText, isMe && styles.editActionTextMe]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.editActionBtn} onPress={() => saveEditMessage(msg.id)}>
                              <Text style={[styles.editActionText, isMe && styles.editActionTextMe]}>Save</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : showText ? (
                        <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
                          {msg.message_text}
                        </Text>
                      ) : null}

                      <Text style={[styles.bubbleTime, isMe && { color: 'rgba(255,255,255,0.6)' }]}>
                        {formatRelativeTime(msg.created_at)}
                      </Text>

                      {isMe && !isEditing ? (
                        <View style={styles.messageActions}>
                          <TouchableOpacity
                            style={styles.messageActionBtn}
                            onPress={() => startEditMessage(msg)}
                          >
                            <Ionicons name="create-outline" size={14} color={COLORS.white} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.messageActionBtn}
                            onPress={() => confirmDeleteMessage(msg.id)}
                          >
                            <Ionicons name="trash-outline" size={14} color={COLORS.white} />
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Message Input */}
          <View style={styles.composer}>
            {selectedImages.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectedImagesRow}
              >
                {selectedImages.map((image, idx) => (
                  <View key={`${image.uri}-${idx}`} style={styles.selectedImageWrap}>
                    <Image source={{ uri: image.uri }} style={styles.selectedImage} />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => removeSelectedImage(idx)}
                    >
                      <Ionicons name="close" size={12} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : null}

            <View style={styles.inputBar}>
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={handlePickImages}
                disabled={sending}
              >
                <Ionicons name="image-outline" size={20} color={COLORS.primary[600]} />
              </TouchableOpacity>
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
                style={[styles.sendBtn, ((!newMessage.trim() && selectedImages.length === 0) || sending) && { opacity: 0.5 }]}
                onPress={handleSendMessage}
                disabled={(!newMessage.trim() && selectedImages.length === 0) || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Ionicons name="send" size={18} color={COLORS.white} />
                )}
              </TouchableOpacity>
            </View>
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
            onPress={() => {
              setActiveTab(tab.key);
              setSelectedThread(null);
              setSelectedImages([]);
              cancelEditMessage();
            }}
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

      <Modal
        visible={!!viewingImageUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingImageUrl(null)}
      >
        <TouchableOpacity
          style={styles.imageModal}
          activeOpacity={1}
          onPress={() => setViewingImageUrl(null)}
        >
          {viewingImageUrl ? (
            <Image source={{ uri: viewingImageUrl }} style={styles.imageModalPhoto} />
          ) : null}
        </TouchableOpacity>
      </Modal>
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
  tabContent: { padding: 16, gap: 16 },
  // Chapter overview card
  overviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    padding: 20,
  },
  overviewCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 20,
  },
  overviewIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  lectureTitle: { fontSize: 20, fontWeight: '700', color: COLORS.slate[900], marginBottom: 4 },
  lectureDesc: { fontSize: 14, color: COLORS.slate[500], lineHeight: 21 },
  overviewStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate[100],
    marginBottom: 20,
  },
  overviewStatItem: { alignItems: 'center' },
  overviewStatValue: { fontSize: 18, fontWeight: '700', color: COLORS.slate[900] },
  overviewStatLabel: { fontSize: 12, color: COLORS.slate[500], marginTop: 2 },
  overviewStatDivider: { width: 1, height: 28, backgroundColor: COLORS.slate[200] },
  startQuizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary[600],
    borderRadius: 8,
    height: 44,
    width: '100%',
  },
  startQuizBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  // Sections
  sectionBlock: { gap: 12 },
  blockTitle: { fontSize: 14, fontWeight: '600', color: COLORS.slate[900] },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.slate[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCardTitle: { fontSize: 14, fontWeight: '500', color: COLORS.slate[800] },
  sectionCardSub: { fontSize: 12, color: COLORS.slate[400], marginTop: 2 },
  // Materials section
  materialsBlock: { gap: 12 },
  materialsHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  materialsHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialsHeaderTitle: { fontSize: 18, fontWeight: '800', color: COLORS.slate[900] },
  materialsHeaderSub: { fontSize: 13, fontWeight: '500', color: COLORS.slate[500] },
  noteContent: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate[100],
  },
  noteContentText: { fontSize: 14, color: COLORS.slate[600], lineHeight: 20, fontWeight: '500' },
  materialLink: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate[100],
  },
  materialLinkText: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.primary[600] },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: { fontSize: 14, fontWeight: '500', color: COLORS.slate[500] },
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
  materialBody: { flex: 1, minWidth: 0 },
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
  imageModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  imageModalPhoto: {
    width: '100%',
    height: '85%',
    resizeMode: 'contain',
  },
  chatError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.rose[50],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.rose[400],
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chatErrorText: { flex: 1, fontSize: 12, fontWeight: '600', color: COLORS.rose[600] },
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
  msgImageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  msgImage: {
    width: 210,
    height: 150,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: COLORS.slate[200],
  },
  msgImageSmall: {
    width: 96,
    height: 96,
    borderRadius: 8,
    backgroundColor: COLORS.slate[200],
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 8,
  },
  messageActionBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBox: { gap: 8, minWidth: 180 },
  editInput: {
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.slate[900],
  },
  editInputMe: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.25)',
    color: COLORS.white,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editActionText: { fontSize: 11, fontWeight: '700', color: COLORS.primary[600] },
  editActionTextMe: { color: COLORS.white },
  composer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate[200],
  },
  selectedImagesRow: { paddingHorizontal: 10, paddingTop: 10, gap: 8 },
  selectedImageWrap: { position: 'relative' },
  selectedImage: {
    width: 58,
    height: 58,
    borderRadius: 8,
    backgroundColor: COLORS.slate[100],
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.rose[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.white,
    padding: 10,
    gap: 8,
  },
  attachBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary[100],
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
