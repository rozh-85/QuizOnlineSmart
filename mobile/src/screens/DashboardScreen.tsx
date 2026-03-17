import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/app';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }: any) => {
  const { profile } = useAuth();
  const { lectures, questions, materials, loading, refresh } = useData();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = profile?.full_name
    ? profile.full_name.trim().split(/\s+/)[0]
    : 'Student';

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
      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroContent}>
          <Text style={styles.heroGreeting}>{greeting()},</Text>
          <Text style={styles.heroName}>{firstName}</Text>
          <Text style={styles.heroSub}>
            {lectures.length > 0
              ? `You have ${lectures.length} lecture${lectures.length > 1 ? 's' : ''} available`
              : 'No lectures yet'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => navigation.navigate('QRScan')}
          activeOpacity={0.8}
        >
          <Ionicons name="qr-code" size={22} color={COLORS.primary[600]} />
          <Text style={styles.scanBtnText}>Scan QR</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="book-outline" size={18} color={COLORS.primary[500]} />
          <Text style={styles.statValue}>{lectures.length}</Text>
          <Text style={styles.statLabel}>Lectures</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="help-circle-outline" size={18} color={COLORS.violet[500]} />
          <Text style={styles.statValue}>{visibleQuestionCount}</Text>
          <Text style={styles.statLabel}>Questions</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="layers-outline" size={18} color={COLORS.amber[500]} />
          <Text style={styles.statValue}>{sectionCount}</Text>
          <Text style={styles.statLabel}>Sections</Text>
        </View>
      </View>

      {/* Lectures Grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Lectures</Text>
        <Text style={styles.sectionCount}>{lectures.length}</Text>
      </View>

      {lectures.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="book-outline" size={32} color={COLORS.slate[300]} />
          <Text style={styles.emptyTitle}>No lectures yet</Text>
          <Text style={styles.emptySub}>Your lectures will appear here</Text>
        </View>
      ) : (
        <View style={styles.lectureGrid}>
          {lectures.map((lecture, index) => {
            const qCount = questions.filter(q => q.lectureId === lecture.id && q.isVisible !== false).length;
            const mCount = materials.filter(m => m.lectureId === lecture.id).length;
            const accentColors = [
              COLORS.primary[500],
              COLORS.emerald[500],
              COLORS.violet[500],
              COLORS.amber[500],
              COLORS.rose[500],
            ];
            const accent = accentColors[index % accentColors.length];

            return (
              <TouchableOpacity
                key={lecture.id}
                style={styles.lectureCard}
                onPress={() => navigation.navigate('LectureDetail', { lectureId: lecture.id })}
                activeOpacity={0.7}
              >
                <View style={[styles.lectureAccent, { backgroundColor: accent }]} />
                <View style={styles.lectureBody}>
                  <Text style={styles.lectureTitle} numberOfLines={2}>{lecture.title}</Text>
                  {lecture.description ? (
                    <Text style={styles.lectureDesc} numberOfLines={2}>{lecture.description}</Text>
                  ) : null}
                  <View style={styles.lectureMeta}>
                    {qCount > 0 && (
                      <View style={styles.metaBadge}>
                        <Ionicons name="help-circle" size={12} color={COLORS.violet[500]} />
                        <Text style={styles.metaText}>{qCount}</Text>
                      </View>
                    )}
                    {mCount > 0 && (
                      <View style={styles.metaBadge}>
                        <Ionicons name="document-text" size={12} color={COLORS.emerald[500]} />
                        <Text style={styles.metaText}>{mCount}</Text>
                      </View>
                    )}
                    {lecture.sections?.length > 0 && (
                      <View style={styles.metaBadge}>
                        <Ionicons name="layers" size={12} color={COLORS.amber[500]} />
                        <Text style={styles.metaText}>{lecture.sections.length}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.slate[300]} />
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
  heroBanner: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate[200],
    padding: 20,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroContent: {
    flex: 1,
  },
  heroGreeting: {
    fontSize: 14,
    color: COLORS.slate[500],
    fontWeight: '500',
  },
  heroName: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.slate[900],
    marginTop: 2,
  },
  heroSub: {
    fontSize: 13,
    color: COLORS.slate[400],
    marginTop: 4,
  },
  scanBtn: {
    backgroundColor: COLORS.primary[50],
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  scanBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary[600],
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.slate[900],
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.slate[500],
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate[900],
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate[400],
    backgroundColor: COLORS.slate[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  emptyCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate[500],
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.slate[400],
  },
  lectureGrid: {
    paddingHorizontal: 16,
    gap: 10,
  },
  lectureCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  lectureAccent: {
    width: 4,
    alignSelf: 'stretch',
  },
  lectureBody: {
    flex: 1,
    padding: 14,
  },
  lectureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate[900],
  },
  lectureDesc: {
    fontSize: 12,
    color: COLORS.slate[500],
    marginTop: 3,
    lineHeight: 17,
  },
  lectureMeta: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 10,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate[500],
  },
});

export default DashboardScreen;
