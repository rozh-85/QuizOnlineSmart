import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/app';
import { useAuth } from '../context/AuthContext';
import { attendanceApi } from '../api/attendanceApi';
import { formatDate, formatTime } from '../utils/format';

const ProfileScreen = ({ navigation }: any) => {
  const { profile, user, signOut } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'present' | 'removed'>('all');

  const fetchRecords = async () => {
    if (!user) return;
    try {
      const r = await attendanceApi.getStudentAttendanceHistory(user.id);
      setRecords(r);
    } catch (e) {
      console.error('Profile fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [user]);

  const onRefresh = () => { setRefreshing(true); fetchRecords(); };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (e) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const totalHours = records
    .filter(r => r.status === 'present')
    .reduce((sum: number, r: any) => sum + (r.hours_attended || 0), 0);

  const presentCount = records.filter(r => r.status === 'present').length;
  const attendanceRate = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

  const filteredRecords = useMemo(() => {
    if (filter === 'all') return records;
    return records.filter(r => r.status === filter);
  }, [records, filter]);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.full_name || 'Student'}</Text>
            <Text style={styles.profileEmail}>{profile?.email}</Text>
            {profile?.serial_id && (
              <View style={styles.serialBadge}>
                <Text style={styles.serialText}>ID: {profile.serial_id}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.rose[500]} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={18} color={COLORS.emerald[500]} />
            <Text style={styles.statValue}>{attendanceRate}%</Text>
            <Text style={styles.statLabel}>Rate</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="ribbon" size={18} color={COLORS.primary[500]} />
            <Text style={styles.statValue}>{presentCount}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={18} color={COLORS.amber[500]} />
            <Text style={styles.statValue}>{totalHours.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Hours</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          <Text style={styles.sectionTitle}>Attendance History</Text>
          <View style={styles.filterTabs}>
            {(['all', 'present', 'removed'] as const).map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterTab, filter === f && styles.filterTabActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                  {f === 'all' ? 'All' : f === 'present' ? 'Present' : 'Removed'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Records */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary[500]} />
          </View>
        ) : filteredRecords.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={32} color={COLORS.slate[300]} />
            <Text style={styles.emptyTitle}>
              {records.length === 0 ? 'No attendance records' : 'No matching records'}
            </Text>
            <Text style={styles.emptySub}>
              {records.length === 0 ? 'Scan a QR code to track attendance' : 'Try changing the filter'}
            </Text>
          </View>
        ) : (
          <View style={styles.recordsList}>
            {filteredRecords.map(record => {
              const session = record.session;
              const isPresent = record.status === 'present';
              const isRemoved = record.status === 'removed';

              return (
                <View key={record.id} style={styles.recordCard}>
                  <View style={[
                    styles.recordIcon,
                    {
                      backgroundColor: isPresent ? COLORS.emerald[50] : isRemoved ? COLORS.rose[50] : COLORS.slate[50],
                    },
                  ]}>
                    <Ionicons
                      name={isPresent ? 'checkmark-circle' : isRemoved ? 'close-circle' : 'remove-circle'}
                      size={18}
                      color={isPresent ? COLORS.emerald[600] : isRemoved ? COLORS.rose[500] : COLORS.slate[400]}
                    />
                  </View>
                  <View style={styles.recordBody}>
                    <Text style={styles.recordTitle} numberOfLines={1}>
                      {session?.lecture?.title || session?.class?.name || 'Session'}
                    </Text>
                    <View style={styles.recordMeta}>
                      <View style={styles.recordMetaItem}>
                        <Ionicons name="calendar-outline" size={11} color={COLORS.slate[400]} />
                        <Text style={styles.recordMetaText}>
                          {session?.session_date ? formatDate(session.session_date) : formatDate(record.time_joined)}
                        </Text>
                      </View>
                      {record.time_joined && (
                        <View style={styles.recordMetaItem}>
                          <Ionicons name="time-outline" size={11} color={COLORS.slate[400]} />
                          <Text style={styles.recordMetaText}>{formatTime(record.time_joined)}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.recordRight}>
                    {isPresent && record.hours_attended ? (
                      <View>
                        <Text style={styles.hoursText}>{record.hours_attended.toFixed(1)}h</Text>
                        <Text style={styles.presentLabel}>Present</Text>
                      </View>
                    ) : (
                      <View style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isPresent ? COLORS.emerald[50] : isRemoved ? COLORS.rose[50] : COLORS.slate[50],
                        },
                      ]}>
                        <Text style={[
                          styles.statusText,
                          {
                            color: isPresent ? COLORS.emerald[600] : isRemoved ? COLORS.rose[500] : COLORS.slate[500],
                          },
                        ]}>
                          {record.status}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate[50] },
  profileHeader: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate[200],
    padding: 16,
    paddingTop: 8,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '800', color: COLORS.slate[900] },
  profileEmail: { fontSize: 13, color: COLORS.slate[500], marginTop: 1 },
  serialBadge: {
    backgroundColor: COLORS.slate[100],
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  serialText: { fontSize: 11, fontWeight: '600', color: COLORS.slate[600] },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.rose[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
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
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.slate[900] },
  statLabel: { fontSize: 11, color: COLORS.slate[500], fontWeight: '500' },
  filterRow: { marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.slate[900], marginBottom: 10 },
  filterTabs: { flexDirection: 'row', gap: 6 },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
  },
  filterTabActive: {
    backgroundColor: COLORS.primary[50],
    borderColor: COLORS.primary[200],
  },
  filterTabText: { fontSize: 12, fontWeight: '600', color: COLORS.slate[500] },
  filterTabTextActive: { color: COLORS.primary[600] },
  loadingContainer: { paddingVertical: 40, alignItems: 'center' },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: COLORS.slate[500] },
  emptySub: { fontSize: 12, color: COLORS.slate[400] },
  recordsList: { gap: 8 },
  recordCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.slate[200],
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBody: { flex: 1 },
  recordTitle: { fontSize: 14, fontWeight: '600', color: COLORS.slate[900] },
  recordMeta: { flexDirection: 'row', gap: 12, marginTop: 4 },
  recordMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  recordMetaText: { fontSize: 11, color: COLORS.slate[400] },
  recordRight: { alignItems: 'flex-end' },
  hoursText: { fontSize: 15, fontWeight: '700', color: COLORS.emerald[600] },
  presentLabel: { fontSize: 11, color: COLORS.emerald[500], marginTop: 1 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
});

export default ProfileScreen;
