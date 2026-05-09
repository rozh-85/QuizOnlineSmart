import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/app';
import { useData } from '../context/DataContext';
import type { Question } from '../types/app';

interface QuizState {
  currentIndex: number;
  selectedAnswer: number | string | null;
  isAnswered: boolean;
  score: number;
  answers: (number | string | null)[];
}

const DIFF_COLORS = {
  easy: { bg: COLORS.emerald[50], text: COLORS.emerald[600] },
  medium: { bg: COLORS.amber[50], text: COLORS.amber[600] },
  hard: { bg: COLORS.rose[50], text: COLORS.rose[500] },
};

const QuizScreen = ({ route, navigation }: any) => {
  const { lectureId, section } = route.params;
  const { lectures, getQuestionsByLecture } = useData();

  const lecture = lectures.find(l => l.id === lectureId);
  const allQuestions = getQuestionsByLecture(lectureId);
  const questions = section
    ? allQuestions.filter(q => q.sectionId === section)
    : allQuestions;

  const [state, setState] = useState<QuizState>({
    currentIndex: 0,
    selectedAnswer: null,
    isAnswered: false,
    score: 0,
    answers: [],
  });
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const { currentIndex, selectedAnswer, isAnswered, score } = state;
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progress = questions.length > 0 ? (currentIndex + 1) / questions.length : 0;

  const checkAnswer = (answer: number | string | null): boolean => {
    if (!currentQuestion || answer === null) return false;
    if (currentQuestion.type === 'blank') {
      return String(answer).trim().toLowerCase() ===
        (currentQuestion.correctAnswer || '').trim().toLowerCase();
    }
    return answer === currentQuestion.correctIndex;
  };

  const handleSelect = (answer: number | string) => {
    if (isAnswered) return;
    setState(prev => ({ ...prev, selectedAnswer: answer }));
  };

  const handleSubmit = () => {
    if (selectedAnswer === null || isAnswered) return;
    const correct = checkAnswer(selectedAnswer);
    setState(prev => ({
      ...prev,
      isAnswered: true,
      score: correct ? prev.score + 1 : prev.score,
      answers: [...prev.answers, selectedAnswer],
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      navigation.replace('QuizResults', {
        score: state.score,
        total: questions.length,
        answers: [...state.answers],
        questions,
        lectureId,
        lectureTitle: lecture?.title || 'Quiz',
      });
      return;
    }

    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      setState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        selectedAnswer: null,
        isAnswered: false,
      }));
    }, 150);
  };

  const leaveQuiz = () => {
    setShowExitConfirm(false);

    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    if (lectureId) {
      navigation.replace('LectureDetail', { lectureId });
      return;
    }

    navigation.navigate('MainTabs');
  };

  const handleExit = () => {
    setShowExitConfirm(true);
  };

  if (!currentQuestion || questions.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="help-circle-outline" size={48} color={COLORS.slate[300]} />
        <Text style={styles.emptyTitle}>No questions available</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCorrect = isAnswered && checkAnswer(selectedAnswer);
  const diffColors = DIFF_COLORS[currentQuestion.difficulty] || DIFF_COLORS.easy;

  const renderOptions = () => {
    if (currentQuestion.type === 'blank') {
      const hasInlineBlank = currentQuestion.text.includes('_____');

      if (hasInlineBlank) {
        const parts = currentQuestion.text.split('_____');
        return (
          <View style={styles.inlineBlankContainer}>
            {parts.map((part, i) => (
              <React.Fragment key={i}>
                <Text style={styles.inlineText}>{part}</Text>
                {i < parts.length - 1 && (
                  <TextInput
                    style={[
                      styles.blankInlineInput,
                      isAnswered && (isCorrect
                        ? styles.blankCorrect
                        : styles.blankWrong),
                    ]}
                    value={typeof selectedAnswer === 'string' ? selectedAnswer : ''}
                    onChangeText={(text) => handleSelect(text)}
                    editable={!isAnswered}
                    placeholder="type answer"
                    placeholderTextColor={COLORS.slate[400]}
                    autoCapitalize="none"
                    onSubmitEditing={handleSubmit}
                    returnKeyType="done"
                  />
                )}
              </React.Fragment>
            ))}
          </View>
        );
      }

      return (
        <View style={styles.blankContainer}>
          <TextInput
            style={[
              styles.blankInput,
              isAnswered && (isCorrect ? styles.blankCorrect : styles.blankWrong),
            ]}
            value={typeof selectedAnswer === 'string' ? selectedAnswer : ''}
            onChangeText={(text) => handleSelect(text)}
            editable={!isAnswered}
            placeholder="Type your answer..."
            placeholderTextColor={COLORS.slate[400]}
            autoCapitalize="none"
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
          />
        </View>
      );
    }

    if (currentQuestion.type === 'true-false') {
      const tfOptions = ['True', 'False'];
      return (
        <View style={styles.tfContainer}>
          {tfOptions.map((label, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrectOption = currentQuestion.correctIndex === idx;

            let optionStyle = styles.tfOption;
            let textStyle = styles.tfText;

            if (isAnswered) {
              if (isCorrectOption) {
                optionStyle = { ...styles.tfOption, ...styles.optionCorrectBg };
                textStyle = { ...styles.tfText, color: COLORS.emerald[600] };
              } else if (isSelected && !isCorrectOption) {
                optionStyle = { ...styles.tfOption, ...styles.optionWrongBg };
                textStyle = { ...styles.tfText, color: COLORS.rose[600] };
              } else {
                optionStyle = { ...styles.tfOption, ...styles.optionFaded };
              }
            } else if (isSelected) {
              optionStyle = { ...styles.tfOption, ...styles.optionSelected };
            }

            return (
              <TouchableOpacity
                key={idx}
                style={[optionStyle]}
                onPress={() => handleSelect(idx)}
                disabled={isAnswered}
                activeOpacity={0.7}
              >
                <Text style={[textStyle]}>{label}</Text>
                {isAnswered && isCorrectOption && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.emerald[500]} />
                )}
                {isAnswered && isSelected && !isCorrectOption && (
                  <Ionicons name="close-circle" size={20} color={COLORS.rose[500]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    // Multiple choice
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    return (
      <View style={styles.optionsList}>
        {currentQuestion.options.map((opt, idx) => {
          const isSelected = selectedAnswer === idx;
          const isCorrectOption = currentQuestion.correctIndex === idx;

          let cardStyle: any[] = [styles.optionCard];
          let letterStyle: any[] = [styles.optionLetterCircle];
          let letterTextStyle: any[] = [styles.optionLetterText];

          if (isAnswered) {
            if (isCorrectOption) {
              cardStyle.push(styles.optionCorrectBg);
              letterStyle.push({ backgroundColor: COLORS.emerald[500] });
              letterTextStyle.push({ color: COLORS.white });
            } else if (isSelected && !isCorrectOption) {
              cardStyle.push(styles.optionWrongBg);
              letterStyle.push({ backgroundColor: COLORS.rose[500] });
              letterTextStyle.push({ color: COLORS.white });
            } else {
              cardStyle.push(styles.optionFaded);
            }
          } else if (isSelected) {
            cardStyle.push(styles.optionSelected);
            letterStyle.push({ backgroundColor: COLORS.primary[600] });
            letterTextStyle.push({ color: COLORS.white });
          }

          return (
            <TouchableOpacity
              key={idx}
              style={cardStyle}
              onPress={() => handleSelect(idx)}
              disabled={isAnswered}
              activeOpacity={0.7}
            >
              <View style={letterStyle}>
                <Text style={letterTextStyle}>{letters[idx]}</Text>
              </View>
              <Text style={[styles.optionText, isAnswered && !isCorrectOption && !isSelected && { color: COLORS.slate[400] }]}>
                {opt}
              </Text>
              {isAnswered && isCorrectOption && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.emerald[500]} style={{ marginLeft: 'auto' }} />
              )}
              {isAnswered && isSelected && !isCorrectOption && (
                <Ionicons name="close-circle" size={20} color={COLORS.rose[500]} style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit} style={styles.exitBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.slate[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{lecture?.title || 'Quiz'}</Text>
        <Text style={styles.headerCount}>{currentIndex + 1} / {questions.length}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Question Content */}
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Difficulty + Result Badge */}
          <View style={styles.metaRow}>
            <View style={[styles.diffBadge, { backgroundColor: diffColors.bg }]}>
              <Ionicons name="flag" size={11} color={diffColors.text} />
              <Text style={[styles.diffText, { color: diffColors.text }]}>
                {currentQuestion.difficulty}
              </Text>
            </View>
            {isAnswered && (
              <Text style={[styles.resultLabel, { color: isCorrect ? COLORS.emerald[600] : COLORS.rose[500] }]}>
                {isCorrect ? 'Correct' : 'Incorrect'}
              </Text>
            )}
          </View>

          {/* Question Text */}
          {!(currentQuestion.type === 'blank' && currentQuestion.text.includes('_____')) && (
            <Text style={styles.questionText}>{currentQuestion.text}</Text>
          )}

          {/* Options */}
          {renderOptions()}

          {/* Correct Answer Reveal (for wrong blank answers) */}
          {isAnswered && !isCorrect && currentQuestion.type === 'blank' && currentQuestion.correctAnswer && (
            <View style={styles.correctReveal}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.emerald[500]} />
              <Text style={styles.correctRevealText}>
                Correct answer: {currentQuestion.correctAnswer}
              </Text>
            </View>
          )}

          {/* Explanation */}
          {isAnswered && currentQuestion.explanation && (
            <View style={styles.explanationBox}>
              <Ionicons name="bulb" size={16} color={COLORS.primary[600]} />
              <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.reportBtn}>
          <Ionicons name="flag-outline" size={18} color={COLORS.slate[400]} />
          <Text style={styles.reportText}>Report</Text>
        </TouchableOpacity>

        {!isAnswered ? (
          <TouchableOpacity
            style={[styles.submitBtn, selectedAnswer === null && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={selectedAnswer === null}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>Submit Answer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.nextBtnText}>
              {isLastQuestion ? 'View Summary' : 'Next Question'}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showExitConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitConfirm(false)}
      >
        <View style={styles.exitModalOverlay}>
          <View style={styles.exitModalCard}>
            <Text style={styles.exitModalTitle}>Leave Quiz?</Text>
            <Text style={styles.exitModalMessage}>
              Your progress will be lost. You've answered {state.answers.length} of {questions.length} questions.
            </Text>
            <View style={styles.exitModalActions}>
              <TouchableOpacity
                style={styles.exitCancelBtn}
                onPress={() => setShowExitConfirm(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.exitCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exitLeaveBtn}
                onPress={leaveQuiz}
                activeOpacity={0.8}
              >
                <Text style={styles.exitLeaveText}>Leave Quiz</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate[50] },
  centered: {
    flex: 1,
    backgroundColor: COLORS.slate[50],
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  emptyTitle: { fontSize: 14, fontWeight: '500', color: COLORS.slate[500] },
  backBtn: {
    backgroundColor: COLORS.primary[600],
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 8,
  },
  backBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.white },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate[200],
  },
  exitBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.slate[700] },
  headerCount: { fontSize: 13, fontWeight: '700', color: COLORS.primary[600] },

  // Progress bar
  progressBarBg: {
    height: 3,
    backgroundColor: COLORS.slate[200],
  },
  progressBarFill: {
    height: 3,
    backgroundColor: COLORS.primary[600],
  },

  // Content
  scrollContent: { flex: 1, padding: 20 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  diffText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  resultLabel: { fontSize: 13, fontWeight: '700' },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.slate[900],
    lineHeight: 24,
    marginBottom: 24,
  },

  // Multiple-choice options
  optionsList: { gap: 10 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.slate[200],
    padding: 14,
  },
  optionLetterCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: { fontSize: 13, fontWeight: '700', color: COLORS.slate[600] },
  optionText: { fontSize: 14, color: COLORS.slate[700], flex: 1 },
  optionSelected: {
    borderColor: COLORS.primary[400],
    backgroundColor: COLORS.primary[50],
  },
  optionCorrectBg: {
    borderColor: COLORS.emerald[400],
    backgroundColor: COLORS.emerald[50],
  },
  optionWrongBg: {
    borderColor: COLORS.rose[400],
    backgroundColor: COLORS.rose[50],
  },
  optionFaded: {
    backgroundColor: COLORS.slate[50],
    borderColor: COLORS.slate[100],
  },

  // True/False
  tfContainer: { flexDirection: 'row', gap: 12 },
  tfOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.slate[200],
    paddingVertical: 16,
  },
  tfText: { fontSize: 15, fontWeight: '600', color: COLORS.slate[700] },

  // Blank / fill-in
  blankContainer: { marginTop: 4 },
  blankInput: {
    borderWidth: 1.5,
    borderColor: COLORS.slate[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.slate[900],
    backgroundColor: COLORS.white,
  },
  blankCorrect: { borderColor: COLORS.emerald[400], backgroundColor: COLORS.emerald[50] },
  blankWrong: { borderColor: COLORS.rose[400], backgroundColor: COLORS.rose[50] },
  inlineBlankContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 16,
  },
  inlineText: { fontSize: 15, color: COLORS.slate[900], lineHeight: 28 },
  blankInlineInput: {
    borderWidth: 1.5,
    borderColor: COLORS.slate[300],
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 14,
    color: COLORS.slate[900],
    backgroundColor: COLORS.white,
    minWidth: 100,
    maxWidth: 180,
    marginHorizontal: 4,
  },

  // Correct answer reveal
  correctReveal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.emerald[50],
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  correctRevealText: { fontSize: 13, fontWeight: '600', color: COLORS.emerald[600] },

  // Explanation
  explanationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.primary[50],
    borderWidth: 1,
    borderColor: COLORS.primary[100],
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
  },
  explanationText: { flex: 1, fontSize: 13, color: COLORS.slate[700], lineHeight: 20 },

  // Action bar
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate[200],
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportText: { fontSize: 12, color: COLORS.slate[400] },
  submitBtn: {
    backgroundColor: COLORS.primary[600],
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  submitBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary[600],
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  nextBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  btnDisabled: { opacity: 0.4 },

  // Exit confirmation
  exitModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  exitModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 18,
  },
  exitModalTitle: { fontSize: 14, fontWeight: '800', color: COLORS.slate[900], marginBottom: 8 },
  exitModalMessage: { fontSize: 12, fontWeight: '500', color: COLORS.slate[500], lineHeight: 18 },
  exitModalActions: { flexDirection: 'row', gap: 8, marginTop: 18 },
  exitCancelBtn: {
    flex: 1,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  exitLeaveBtn: {
    flex: 1,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.rose[500],
  },
  exitCancelText: { fontSize: 12, fontWeight: '700', color: COLORS.slate[600] },
  exitLeaveText: { fontSize: 12, fontWeight: '800', color: COLORS.white },
});

export default QuizScreen;
