import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/app';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const ACCENT_PALETTE = [
  { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
  { color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
  { color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  { color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  { color: '#06b6d4', bg: 'rgba(6,182,212,0.08)' },
];

const DashboardScreen = ({ navigation }: any) => {
  const { profile } = useAuth();
  const { lectures, questions, loading, refresh } = useData();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = profile?.full_name
    ? profile.full_name.trim().split(/\s+/)[0]
    : 'Student';

  const initials = firstName
    ? firstName.trim().split(/\s+/).slice(0, 2).map((n: string) => n[0]?.toUpperCase() ?? '').join('')
    : '?';

  const visibleQuestionCount = useMemo(
    () => questions.filter(q => q.isVisible !== false).length,
    [questions]
  );

  const sectionCount = useMemo(
    () => lectures.reduce((sum, l) => sum + (l.sections?.length ?? 0), 0),
    [lectures]
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
    >
      {/* ── Hero Banner (gradient, matching web mobile) ── */}
      <LinearGradient
        colors={[COLORS.primary[600], COLORS.primary[700], '#6d28d9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBanner}
      >
        {/* Decorative blur orbs */}
        <View style={styles.orbViolet} />
        <View style={styles.orbBlue} />

        <View style={styles.heroTopRow}>
          <View style={styles.heroLeft}>
            {/* Glass avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroGreeting}>{greeting()}</Text>
              <Text style={styles.heroName}>{firstName}</Text>
              <Text style={styles.heroSub}>Pick a lecture to begin</Text>
            </View>
          </View>

          {/* QR scan shortcut (glass style) */}
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => navigation.navigate('QRScan')}
            activeOpacity={0.7}
          >
            <Ionicons name="qr-code" size={15} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Module count pill */}
        <View style={styles.modulePill}>
          <Ionicons name="play-circle" size={13} color="rgba(255,255,255,0.8)" />
          <Text style={styles.modulePillText}>{lectures.length} Modules</Text>
        </View>
      </LinearGradient>

      {/* ── Stats Row (overlapping hero) ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#eff6ff' }]}>
            <Ionicons name="book-outline" size={17} color="#2563eb" />
          </View>
          <Text style={styles.statValue}>{lectures.length}</Text>
          <Text style={styles.statLabel}>Lectures</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#f5f3ff' }]}>
            <Ionicons name="help-circle-outline" size={17} color="#7c3aed" />
          </View>
          <Text style={styles.statValue}>{visibleQuestionCount}</Text>
          <Text style={styles.statLabel}>Questions</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#ecfdf5' }]}>
            <Ionicons name="layers-outline" size={17} color="#059669" />
          </View>
          <Text style={styles.statValue}>{sectionCount}</Text>
          <Text style={styles.statLabel}>Sections</Text>
        </View>
      </View>

      {/* ── Section Header ── */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Available Lectures</Text>
          <Text style={styles.sectionCount}>{lectures.length} Modules</Text>
        </View>
      </View>

      {/* ── Lecture Cards ── */}
      {lectures.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="book-outline" size={28} color={COLORS.slate[300]} />
          </View>
          <Text style={styles.emptyTitle}>No lectures yet</Text>
          <Text style={styles.emptySub}>Check back soon for new content</Text>
        </View>
      ) : (
        <View style={styles.lectureGrid}>
          {lectures.map((lecture, index) => {
            const qCount = questions.filter(q => q.lectureId === lecture.id && q.isVisible !== false).length;
            const accent = ACCENT_PALETTE[index % ACCENT_PALETTE.length];

            return (
              <TouchableOpacity
                key={lecture.id}
                style={styles.lectureCard}
                onPress={() => navigation.navigate('LectureDetail', { lectureId: lecture.id })}
                activeOpacity={0.7}
              >
                {/* Top accent bar */}
                <View style={[styles.lectureAccentBar, { backgroundColor: accent.color }]} />

                <View style={styles.lectureBody}>
                  {/* Header: icon + question badge */}
                  <View style={styles.lectureHeaderRow}>
                    <View style={[styles.lectureIcon, { backgroundColor: accent.bg }]}>
                      <Ionicons name="book-outline" size={18} color={accent.color} />
                    </View>
                    <View style={[styles.questionBadge, { backgroundColor: accent.bg }]}>
                      <Text style={[styles.questionBadgeText, { color: accent.color }]}>
                        {qCount} Q's
                      </Text>
                    </View>
                  </View>

                  {/* Title */}
                  <Text style={styles.lectureTitle} numberOfLines={2}>{lecture.title}</Text>

                  {/* Description */}
                  <Text style={styles.lectureDesc} numberOfLines={2}>
                    {lecture.description || 'Master the key concepts in this module'}
                  </Text>

                  {/* Footer */}
                  <View style={styles.lectureFooter}>
                    {lecture.sections?.length > 0 ? (
                      <View style={styles.sectionsMeta}>
                        <Ionicons name="layers" size={11} color={COLORS.slate[400]} />
                        <Text style={styles.sectionsMetaText}>
                          {lecture.sections.length} sections
                        </Text>
                      </View>
                    ) : (
                      <View />
                    )}
                    <View style={styles.ctaRow}>
                      <Text style={[styles.ctaText, { color: accent.color }]}>Start Quiz</Text>
                      <Ionicons name="arrow-forward" size={13} color={accent.color} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate[50],
  },

  // ── Hero Banner ──
  heroBanner: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 48,
    position: 'relative',
    overflow: 'hidden',
  },
  orbViolet: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 208,
    height: 208,
    borderRadius: 104,
    backgroundColor: 'rgba(167,139,250,0.25)',
  },
  orbBlue: {
    position: 'absolute',
    bottom: 0,
    left: 120,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(147,197,253,0.20)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1,
  },
  heroTextBlock: {
    flex: 1,
  },
  heroGreeting: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 2,
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.60)',
    marginTop: 4,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  modulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 20,
  },
  modulePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.80)',
  },

  // ── Stats Row (overlapping hero) ──
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: -28,
    zIndex: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.slate[100],
    paddingHorizontal: 8,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: COLORS.slate[200],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.slate[900],
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.slate[500],
    fontWeight: '500',
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.slate[900],
  },
  sectionCount: {
    fontSize: 12,
    color: COLORS.slate[400],
    marginTop: 2,
  },

  // ── Empty State ──
  emptyCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 8,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.slate[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate[600],
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.slate[400],
  },

  // ── Lecture Card Grid ──
  lectureGrid: {
    paddingHorizontal: 16,
    gap: 12,
  },
  lectureCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    overflow: 'hidden',
  },
  lectureAccentBar: {
    height: 3,
    width: '100%',
  },
  lectureBody: {
    padding: 20,
  },
  lectureHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  lectureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  questionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  lectureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate[900],
    lineHeight: 20,
    marginBottom: 6,
  },
  lectureDesc: {
    fontSize: 12,
    color: COLORS.slate[500],
    lineHeight: 18,
    marginBottom: 16,
  },
  lectureFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate[100],
  },
  sectionsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionsMetaText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.slate[400],
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default DashboardScreen;
