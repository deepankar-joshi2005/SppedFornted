import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resolveAssetUrl } from '../config/api';
import { Nav } from '../navigation/types';
import { getDashboard, SuccessStoryItem } from '../services/dashboard.service';
import { MUTED, NAVY, SOFT_SHADOW } from '../theme/colors';

type Props = {
  token: string;
  nav: Nav;
};

const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export default function StudentReviewsScreen({ token, nav }: Props) {
  const [stories, setStories] = useState<SuccessStoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh?: boolean) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const data = await getDashboard(token);
      if (data.successStories && data.successStories.length > 0) {
        setStories(data.successStories);
      } else {
        setStories([
          {
            id: 's1',
            studentName: 'Kunal kumar',
            studentImage: '',
            examTag: '• SSC CGL 2025 Selected',
            reviewText:
              'It was a wonderful preparation journey of mine with Speed Education. I was blessed to get taught by the expert teachers on Speed Education ❤️',
          },
          {
            id: 's2',
            studentName: 'Pratiksha',
            studentImage: '',
            examTag: '• SSC CGL 2025 Selected',
            reviewText:
              'Speed Education has played pivotal role in my journey of clearing ssc cgl 2025 in my first attempt. The content delivered by the teachers, especially Admin sir is exceptional and exam oriented. The mock tests resemble the actual exam in layout as well as the type of questions. I express my gratitude to Speed Education team!',
          },
          {
            id: 's3',
            studentName: 'MD ASIF',
            studentImage: '',
            examTag: '• SSC CGL 2025 Selected',
            reviewText:
              'It is so helpful for me Speed Education team. I am really grateful to Admin sir and for my preparation 🎓🎉❤️',
          },
          {
            id: 's4',
            studentName: 'Priya Sharma',
            studentImage: '',
            examTag: '• RRB NTPC AIR 14',
            reviewText:
              'Speed Education live mock tests helped me boost my speed and confidence tremendously before the exam!',
          },
        ]);
      }
    } catch (err) {
      console.log('Failed to load reviews', err);
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Top Navigation Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => nav.pop()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>Student Reviews</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={NAVY} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={stories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />
          }
          ListHeaderComponent={
            <View style={styles.subHeaderCard}>
              <Text style={styles.communitySubText}>SUCCESS STORIES FROM OUR COMMUNITY</Text>
              <View style={styles.championsRow}>
                <Ionicons name="ribbon-outline" size={28} color="#CA8A04" style={styles.laurelIcon} />
                <View style={styles.titleWrap}>
                  <Text style={styles.championsTitleMain}>
                    Our Success <Text style={styles.championsPurple}>Champions</Text>
                  </Text>
                </View>
                <Ionicons name="ribbon-outline" size={28} color="#CA8A04" style={styles.laurelIcon} />
              </View>
              <Text style={styles.subTitleDescription}>
                Discover how Speed Education helped students crack their exams
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <View style={styles.cardHeaderRow}>
                {item.studentImage ? (
                  <Image source={{ uri: resolveAssetUrl(item.studentImage) }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{getInitials(item.studentName)}</Text>
                  </View>
                )}
                <View style={styles.metaWrap}>
                  <Text style={styles.studentName}>{item.studentName}</Text>
                  <Text style={styles.examTag}>{item.examTag}</Text>
                </View>
              </View>
              <Text style={styles.reviewText}>{item.reviewText}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: NAVY },
  listContent: { paddingHorizontal: 18, paddingBottom: 30 },
  subHeaderCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 16,
  },
  communitySubText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  championsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    gap: 8,
  },
  laurelIcon: {
    marginHorizontal: 2,
  },
  titleWrap: {
    alignItems: 'center',
  },
  championsTitleMain: {
    fontSize: 24,
    fontWeight: '900',
    color: NAVY,
  },
  championsPurple: {
    color: '#7C3AED',
  },
  subTitleDescription: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    ...SOFT_SHADOW,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0284C7',
  },
  metaWrap: {
    marginLeft: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
  },
  examTag: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0284C7',
    marginTop: 2,
  },
  reviewText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
  },
});
