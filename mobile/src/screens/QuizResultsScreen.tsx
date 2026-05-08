import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/app';
import type { Question } from '../types/app';

const QuizResultsScreen = ({ route, navigation }: any) => {
  const { score, total, answers, questions, lectureId, lectureTitle } = route.params as {
    score: number;
    total: number;
    answers: (number | string | null)[];
    questions: Question[];
    lectureId: string;
    lectureTitle: string;
  };

  const [reviewIndex, setReviewIndex] = useState<number | null>(null);

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const getGrade = () => {
    if (percentage >= 90) return { emoji: '🏆', label: 'Excellent', color: COLORS.emerald[500] };
    if (percentage >= 70) return { emoji: '🌟', label: 'Great Job', color: COLORS.emerald[400] };
    if (percentage >= 50) return { emoji: '👍', label: 'Good Effort', color: COLORS.amber[500] };
    return { emoji: '💪', label: 'Keep Practicing', color: COLORS.amber[600] };
  };

  const grade = getGrade();
  const wrong = total - score;

  const isAnswerCorrect = (q: Question, answer: number | string | null): boolean => {
    if (answer === null) return false;
    if (q.type === 'blank') {
      return String(answer).trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase();
    }
    return answer === q.correctIndex;
  };

  const getAnswerText = (q: Question, answer: number | string | null): string => {
    if (answer === null) return 'No answer';
    if (q.type === 'blank') return String(answer);
    if (q.type === 'true-false') return answer === 0 ? 'True' : 'False';
    return q.options?.[answer as number] || 'Unknown';
  };

  const getCorrectText = (q: Question): string => {
    if (q.type === 'blank') return q.correctAnswer || '';
    if (q.type === 'true-false') return q.correctIndex === 0 ? 'True' : 'False';
    return q.options?.[q.correctIndex || 0] || '';
  };

  const reviewQuestion = reviewIndex !== null ? questions[reviewIndex] : null;
  const reviewAnswer = reviewIndex !== null ? answers[reviewIndex] : null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Score Header */}
        <View style={styles.scoreHeader}>
          <Text style={styles.gradeEmoji}>{grade.emoji}</Text>
          <Text style={[styles.gradeLabel, { color: grade.color }]}>{grade.label}</Text>

          {/* Score Circle */}
          <View style={styles.scoreCircle}>
            <Text style={[styles.scorePercent, { color: grade.color }]}>{percentage}%</Text>
            <Text style={styles.scoreSubtext}>Correct</Text>
          </View>

          {/* Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{total}</Text>
              <Text style={styles.metricLabel}>Total</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: COLORS.emerald[50] }]}>
              <Text style={[styles.metricValue, { color: COLORS.emerald[600] }]}>{score}</Text>
              <Text style={styles.metricLabel}>Correct</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: COLORS.rose[50] }]}>
              <Text style={[styles.metricValue, { color: COLORS.rose[500] }]}>{wrong}</Text>
              <Text style={styles.metricLabel}>Wrong</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => navigation.replace('Quiz', { lectureId })}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color={COLORS.primary[600]} />
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => navigation.navigate('LectureDetail', { lectureId })}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Answer Review */}
        <View style={styles.reviewSection}>
          <Text style={styles.reviewTitle}>Answer Review</Text>
          <View style={styles.reviewGrid}>
            {questions.map((q, idx) => {
              const answer = answers[idx];
              const correct = isAnswerCorrect(q, answer);
              return (
                <TouchableOpacity
                  key={q.id}
                  style={[styles.reviewCard, correct ? styles.reviewCorrect : styles.reviewWrong]}
                  onPress={() => setReviewIndex(idx)}
                  activeOpacity={0.7}
                >
                  <View style={styles.reviewCardTop}>
                    <Ionicons
                      name={correct ? 'checkmark-circle' : 'close-circle'}
                      size={18}
                      color={correct ? COLORS.emerald[500] : COLORS.rose[500]}
                    />
                    <Text style={styles.reviewCardIdx}>Q{idx + 1}</Text>
                  </View>
                  <Text style={styles.reviewCardText} numberOfLines={2}>{q.text}</Text>
                  <View style={styles.reviewCardAnswer}>
                    <Text style={styles.reviewCardAnswerLabel}>Your answer:</Text>
                    <Text style={[
                      styles.reviewCardAnswerValue,
                      { color: correct ? COLORS.emerald[600] : COLORS.rose[500] },
                    ]} numberOfLines={1}>
                      {getAnswerText(q, answer)}
                    </Text>
                  </View>
                  {!correct && (
                    <View style={styles.reviewCardAnswer}>
                      <Text style={styles.reviewCardAnswerLabel}>Correct:</Text>
                      <Text style={[styles.reviewCardAnswerValue, { color: COLORS.emerald[600] }]} numberOfLines={1}>
                        {getCorrectText(q)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Quick View Modal */}
      <Modal visible={reviewIndex !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Question {(reviewIndex ?? 0) + 1}</Text>
              <TouchableOpacity onPress={() => setReviewIndex(null)}>
                <Ionicons name="close" size={24} color={COLORS.slate[500]} />
              </TouchableOpacity>
            </View>

            {reviewQuestion && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalQuestionText}>{reviewQuestion.text}</Text>

                {reviewQuestion.type === 'multiple-choice' && (
                  <View style={styles.modalOptions}>
                    {reviewQuestion.options.map((opt, oi) => {
                      const isCorrectOpt = reviewQuestion.correctIndex === oi;
                      const isUserPick = reviewAnswer === oi;
                      return (
                        <View
                          key={oi}
                          style={[
                            styles.modalOptionCard,
                            isCorrectOpt && styles.modalOptCorrect,
                            isUserPick && !isCorrectOpt && styles.modalOptWrong,
                          ]}
                        >
                          <View style={[
                            styles.modalOptLetter,
                            isCorrectOpt && { backgroundColor: COLORS.emerald[500] },
                            isUserPick && !isCorrectOpt && { backgroundColor: COLORS.rose[500] },
                          ]}>
                            <Text style={[
                              styles.modalOptLetterText,
                              (isCorrectOpt || (isUserPick && !isCorrectOpt)) && { color: COLORS.white },
                            ]}>
                              {String.fromCharCode(65 + oi)}
                            </Text>
                          </View>
                          <Text style={styles.modalOptText}>{opt}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {reviewQuestion.type === 'true-false' && (
                  <View style={styles.modalTfRow}>
                    {['True', 'False'].map((label, ti) => {
                      const isCorrectOpt = reviewQuestion.correctIndex === ti;
                      const isUserPick = reviewAnswer === ti;
                      return (
                        <View
                          key={ti}
                          style={[
                            styles.modalTfCard,
                            isCorrectOpt && styles.modalOptCorrect,
                            isUserPick && !isCorrectOpt && styles.modalOptWrong,
                          ]}
                        >
                          <Text style={styles.modalTfText}>{label}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {reviewQuestion.type === 'blank' && (
                  <View style={styles.modalBlankSection}>
                    <View style={styles.modalBlankRow}>
                      <Text style={styles.modalBlankLabel}>Your answer:</Text>
                      <Text style={[
                        styles.modalBlankValue,
                        { color: isAnswerCorrect(reviewQuestion, reviewAnswer) ? COLORS.emerald[600] : COLORS.rose[500] },
                      ]}>
                        {String(reviewAnswer || 'No answer')}
                      </Text>
                    </View>
                    <View style={styles.modalBlankRow}>
                      <Text style={styles.modalBlankLabel}>Correct answer:</Text>
                      <Text style={[styles.modalBlankValue, { color: COLORS.emerald[600] }]}>
                        {reviewQuestion.correctAnswer}
                      </Text>
                    </View>
                  </View>
                )}

                {reviewQuestion.explanation && (
                  <View style={styles.modalExplanation}>
                    <Ionicons name="bulb" size={16} color={COLORS.primary[600]} />
                    <Text style={styles.modalExplanationText}>{reviewQuestion.explanation}</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate[50] },

  // Score Header
  scoreHeader: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate[200],
  },
  gradeEmoji: { fontSize: 40, marginBottom: 4 },
  gradeLabel: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: COLORS.slate[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  scorePercent: { fontSize: 32, fontWeight: '800' },
  scoreSubtext: { fontSize: 12, color: COLORS.slate[500], marginTop: 2 },
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 24, width: '100%' },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.slate[50],
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  metricValue: { fontSize: 20, fontWeight: '800', color: COLORS.slate[900] },
  metricLabel: { fontSize: 11, color: COLORS.slate[500], marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 12, width: '100%' },
  retryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary[50],
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.primary[200],
  },
  retryBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary[600] },
  doneBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary[600],
    borderRadius: 10,
    paddingVertical: 14,
  },
  doneBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.white },

  // Review
  reviewSection: { padding: 16 },
  reviewTitle: { fontSize: 16, fontWeight: '700', color: COLORS.slate[900], marginBottom: 12 },
  reviewGrid: { gap: 10 },
  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  reviewCorrect: { borderColor: COLORS.emerald[200] },
  reviewWrong: { borderColor: COLORS.rose[200] },
  reviewCardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  reviewCardIdx: { fontSize: 12, fontWeight: '700', color: COLORS.slate[500] },
  reviewCardText: { fontSize: 13, fontWeight: '500', color: COLORS.slate[800], lineHeight: 19, marginBottom: 8 },
  reviewCardAnswer: { marginTop: 2 },
  reviewCardAnswerLabel: { fontSize: 11, color: COLORS.slate[400] },
  reviewCardAnswerValue: { fontSize: 12, fontWeight: '600', marginTop: 1 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate[200],
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.slate[900] },
  modalBody: { paddingHorizontal: 20, paddingTop: 16 },
  modalQuestionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.slate[900],
    lineHeight: 22,
    marginBottom: 16,
  },
  modalOptions: { gap: 8 },
  modalOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    padding: 12,
  },
  modalOptCorrect: { backgroundColor: COLORS.emerald[50], borderColor: COLORS.emerald[300] },
  modalOptWrong: { backgroundColor: COLORS.rose[50], borderColor: COLORS.rose[300] },
  modalOptLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptLetterText: { fontSize: 12, fontWeight: '700', color: COLORS.slate[600] },
  modalOptText: { flex: 1, fontSize: 13, color: COLORS.slate[700] },
  modalTfRow: { flexDirection: 'row', gap: 10 },
  modalTfCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalTfText: { fontSize: 14, fontWeight: '600', color: COLORS.slate[700] },
  modalBlankSection: { gap: 10 },
  modalBlankRow: {},
  modalBlankLabel: { fontSize: 12, color: COLORS.slate[400], marginBottom: 2 },
  modalBlankValue: { fontSize: 14, fontWeight: '600' },
  modalExplanation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.slate[50],
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
  },
  modalExplanationText: { flex: 1, fontSize: 13, color: COLORS.slate[700], lineHeight: 20 },
});

export default QuizResultsScreen;
