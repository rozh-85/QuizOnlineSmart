import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/app';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { whatsNewApi } from '../api/whatsNewApi';
import { adaptWhatsNewItem } from '../utils/adapters';
import { formatRelativeTime, formatFullDate } from '../utils/format';
import type { WhatsNewItem } from '../types/app';

const ICON_MAP: Record<string, string> = {
  lecture: 'book-outline',
  material: 'document-text-outline',
  question: 'help-circle-outline',
  manual: 'megaphone-outline',
};

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  lecture: { bg: COLORS.primary[50], text: COLORS.primary[600] },
  material: { bg: COLORS.emerald[50], text: COLORS.emerald[600] },
  question: { bg: COLORS.violet[50], text: COLORS.violet[600] },
  manual: { bg: COLORS.amber[50], text: COLORS.amber[600] },
};

interface NewsGroup {
  key: string;
  itemType: string;
  lectureId: string | null;
  items: WhatsNewItem[];
  publishedAt: string;
}

const NewsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { lectures } = useData();
  const [search, setSearch] = useState('');
  const [newsGroups, setNewsGroups] = useState<NewsGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleExpand = (key: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const fetchNews = useCallback(async () => {
    try {
      const raw = await whatsNewApi.getPublished();
      const items = raw.map(adaptWhatsNewItem);

      const groupMap = new Map<string, NewsGroup>();
      for (const item of items) {
        const batchKey = `${item.itemType}::${item.lectureId || 'null'}::${item.publishedAt || ''}`;
        if (!groupMap.has(batchKey)) {
          groupMap.set(batchKey, {
            key: batchKey,
            itemType: item.itemType,
            lectureId: item.lectureId,
            items: [],
            publishedAt: item.publishedAt || item.createdAt,
          });
        }
        groupMap.get(batchKey)!.items.push(item);
      }
      setNewsGroups(Array.from(groupMap.values()));
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    if (user) fetchNews();
  }, [user, fetchNews]);

  const onRefresh = () => { setRefreshing(true); fetchNews(); };

  const getLectureName = (lectureId: string | null) => {
    if (!lectureId) return 'General';
    return lectures.find(l => l.id === lectureId)?.title || 'Lecture';
  };

  const filteredGroups = newsGroups.filter(g => {
    if (!search) return true;
    const s = search.toLowerCase();
    return getLectureName(g.lectureId).toLowerCase().includes(s) ||
      g.items.some(i => i.title.toLowerCase().includes(s));
  });

  const getBadgeLabel = (type: string) => {
    switch (type) {
      case 'lecture': return 'New Lecture';
      case 'material': return 'New Materials';
      case 'question': return 'New Questions';
      case 'manual': return 'Announcement';
      default: return 'Update';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="sparkles" size={18} color={COLORS.amber[600]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>What's New</Text>
          <Text style={styles.headerSub}>Latest updates from your courses</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color={COLORS.slate[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search updates..."
          placeholderTextColor={COLORS.slate[400]}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary[500]} />
          </View>
        ) : filteredGroups.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="sparkles" size={32} color={COLORS.amber[300]} />
            <Text style={styles.emptyTitle}>No updates yet</Text>
            <Text style={styles.emptySub}>Check back soon for new content</Text>
          </View>
        ) : (
          filteredGroups.map((group, idx) => {
            const colors = COLOR_MAP[group.itemType] || COLOR_MAP.lecture;
            const iconName = ICON_MAP[group.itemType] || 'book-outline';
            const lectureName = getLectureName(group.lectureId);
            const isExpanded = expandedKeys.has(group.key);
            const previewCount = 2;
            const hasMore = group.items.length > previewCount;
            const visibleItems = isExpanded ? group.items : group.items.slice(0, previewCount);

            return (
              <TouchableOpacity
                key={group.key}
                style={styles.newsCard}
                activeOpacity={0.7}
                onPress={() => {
                  if (group.lectureId) {
                    navigation.navigate('LectureDetail', { lectureId: group.lectureId });
                  }
                }}
              >
                <View style={styles.newsRow}>
                  <View style={[styles.newsIcon, { backgroundColor: colors.bg }]}>
                    <Ionicons name={iconName as any} size={16} color={colors.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    {/* Badges */}
                    <View style={styles.badgeRow}>
                      {idx === 0 && (
                        <View style={[styles.badge, { backgroundColor: COLORS.amber[100] }]}>
                          <Text style={[styles.badgeText, { color: COLORS.amber[700] }]}>Latest</Text>
                        </View>
                      )}
                      <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                        <Text style={[styles.badgeText, { color: colors.text }]}>{getBadgeLabel(group.itemType)}</Text>
                      </View>
                      {group.items.length > 1 && (
                        <View style={[styles.badge, { backgroundColor: COLORS.slate[100] }]}>
                          <Text style={[styles.badgeText, { color: COLORS.slate[500] }]}>×{group.items.length}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.newsTitle} numberOfLines={1}>{lectureName}</Text>

                    {group.itemType === 'question' ? (
                      <View style={styles.questionList}>
                        {visibleItems.map((item, qi) => (
                          <View key={item.id} style={styles.questionRow}>
                            <Text style={styles.questionRowText} numberOfLines={2}>
                              <Text style={styles.questionNumber}>Q{qi + 1}. </Text>
                              {item.title}
                            </Text>
                          </View>
                        ))}
                        {hasMore && (
                          <TouchableOpacity
                            style={styles.expandBtn}
                            onPress={(e) => { e.stopPropagation?.(); toggleExpand(group.key); }}
                            activeOpacity={0.6}
                          >
                            <Text style={styles.expandBtnText}>
                              {isExpanded ? 'Show less' : `See all ${group.items.length} questions`}
                            </Text>
                            <Ionicons
                              name={isExpanded ? 'chevron-up' : 'chevron-down'}
                              size={14}
                              color={COLORS.violet[600]}
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : (
                      <>
                        {visibleItems.map(item => (
                          <Text key={item.id} style={styles.newsItemText} numberOfLines={1}>{item.title}</Text>
                        ))}
                        {hasMore && (
                          <TouchableOpacity
                            style={styles.expandBtn}
                            onPress={(e) => { e.stopPropagation?.(); toggleExpand(group.key); }}
                            activeOpacity={0.6}
                          >
                            <Text style={[styles.expandBtnText, { color: colors.text }]}>
                              {isExpanded ? 'Show less' : `See all ${group.items.length} items`}
                            </Text>
                            <Ionicons
                              name={isExpanded ? 'chevron-up' : 'chevron-down'}
                              size={14}
                              color={colors.text}
                            />
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </View>
                </View>
                <View style={styles.newsFooter}>
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={11} color={COLORS.slate[400]} />
                    <Text style={styles.timeText}>{formatRelativeTime(group.publishedAt)}</Text>
                  </View>
                  <Text style={styles.dateText}>{formatFullDate(group.publishedAt)}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate[50] },
  header: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate[200],
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.amber[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.slate[900] },
  headerSub: { fontSize: 14, color: COLORS.slate[500], marginTop: 1 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    paddingHorizontal: 14,
    height: 42,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.slate[700] },
  content: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  loadingContainer: { paddingVertical: 64, alignItems: 'center' },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    alignItems: 'center',
    paddingVertical: 56,
    gap: 8,
  },
  emptyTitle: { fontSize: 14, fontWeight: '500', color: COLORS.slate[500] },
  emptySub: { fontSize: 12, color: COLORS.slate[400] },
  newsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    padding: 20,
  },
  newsRow: { flexDirection: 'row', gap: 14 },
  newsIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  badge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  newsTitle: { fontSize: 14, fontWeight: '600', color: COLORS.slate[900] },
  newsItemText: { fontSize: 12, color: COLORS.slate[500], marginTop: 2 },
  moreText: { fontSize: 11, color: COLORS.slate[400], marginTop: 2 },
  questionList: { gap: 6, marginTop: 4 },
  questionRow: {
    backgroundColor: COLORS.violet[50],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  questionRowText: { fontSize: 12, color: COLORS.slate[700], lineHeight: 18 },
  questionNumber: { color: COLORS.violet[500], fontWeight: '600' },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  expandBtnText: { fontSize: 12, fontWeight: '500', color: COLORS.violet[600] },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate[100],
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 11, color: COLORS.slate[400] },
  dateText: { fontSize: 11, color: COLORS.slate[400] },
});

export default NewsScreen;
