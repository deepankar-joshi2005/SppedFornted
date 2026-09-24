import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resolveAssetUrl } from '../config/api';
import { Nav } from '../navigation/types';
import { EbookItem, getEbooks, markEbookViewed } from '../services/ebook.service';
import { ERROR, GOLD, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  nav: Nav;
};

export default function EbooksScreen({ token, nav }: Props) {
  const [ebooks, setEbooks] = useState<EbookItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const result = await getEbooks(token);
        setEbooks(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load e-books.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleOpen = (item: EbookItem) => {
    if (item.isNew) {
      setEbooks((prev) =>
        prev ? prev.map((e) => (e.id === item.id ? { ...e, isNew: false } : e)) : prev
      );
      markEbookViewed(token, item.id);
    }
    nav.push({ name: 'pdfViewer', title: item.title, fileUrl: item.fileUrl });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>E-Books</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />
        }
      >
        {loading && !ebooks && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {!!error && !ebooks && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {ebooks?.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="library-outline" size={30} color={MUTED} />
            <Text style={styles.emptyText}>No e-books available yet.</Text>
          </View>
        )}

        {ebooks?.map((item) => (
          <Pressable key={item.id} style={styles.card} onPress={() => handleOpen(item)}>
            {item.coverImage ? (
              <Image
                source={{ uri: resolveAssetUrl(item.coverImage) }}
                style={styles.cover}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.coverFallback}>
                <Ionicons name="book-outline" size={22} color={NAVY} />
              </View>
            )}
            <View style={styles.cardBody}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
              </View>
              {!!item.author && <Text style={styles.cardAuthor}>{item.author}</Text>}
              <Text style={styles.cardCategory}>{item.category}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={MUTED} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F4EF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
  },
  iconBtn: {
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorBox: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FBEAE8',
  },
  errorText: {
    color: ERROR,
    fontSize: 13,
    textAlign: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: MUTED,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDEBE4',
  },
  cover: {
    width: 44,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#E0F2F1',
  },
  coverFallback: {
    width: 44,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '800',
    color: NAVY,
  },
  cardAuthor: {
    fontSize: 12,
    color: MUTED,
    marginTop: 3,
  },
  cardCategory: {
    fontSize: 11.5,
    color: GOLD,
    fontWeight: '700',
    marginTop: 4,
  },
  newBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#7C4DFF',
  },
  newBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
