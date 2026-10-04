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
import { DownloadedEbookItem, getMyDownloadedEbooks } from '../services/ebook.service';
import { DownloadedPyqItem, getMyDownloadedPyqs } from '../services/pyq.service';
import { ERROR, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  nav: Nav;
};

export default function MyDownloadsScreen({ token, nav }: Props) {
  const [ebooks, setEbooks] = useState<DownloadedEbookItem[] | null>(null);
  const [papers, setPapers] = useState<DownloadedPyqItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (isRefresh?: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const [ebookResult, paperResult] = await Promise.all([
          getMyDownloadedEbooks(token),
          getMyDownloadedPyqs(token),
        ]);
        setEbooks(ebookResult);
        setPapers(paperResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load your downloads.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleOpenEbook = (item: DownloadedEbookItem) => {
    if (item.isLocked || !item.fileUrl) return;
    nav.push({ name: 'pdfViewer', title: item.title, fileUrl: item.fileUrl });
  };

  const handleOpenPaper = (item: DownloadedPyqItem) => {
    if (item.isLocked || !item.fileUrl) return;
    nav.push({ name: 'pdfViewer', title: item.title, fileUrl: item.fileUrl });
  };

  const loaded = !!ebooks && !!papers;
  const isEmpty = loaded && ebooks!.length === 0 && papers!.length === 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>My Downloads</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={NAVY} />
        }
      >
        {loading && !loaded && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {!!error && !loaded && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isEmpty && (
          <View style={styles.emptyBox}>
            <Ionicons name="download-outline" size={32} color={MUTED} />
            <Text style={styles.emptyText}>You haven't downloaded anything yet.</Text>
          </View>
        )}

        {!!ebooks?.length && (
          <>
            <Text style={styles.sectionTitle}>E-Books</Text>
            {ebooks.map((item) => (
              <Pressable key={item.id} style={styles.card} onPress={() => handleOpenEbook(item)}>
                <View style={styles.cardLogoBadge}>
                  {item.coverImage || item.categoryIcon ? (
                    <Image
                      source={{ uri: resolveAssetUrl(item.coverImage || item.categoryIcon) }}
                      style={styles.cardLogoImg}
                      resizeMode="contain"
                    />
                  ) : (
                    <Ionicons name="book-outline" size={22} color={NAVY} />
                  )}
                </View>

                <View style={styles.cardMiddleContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardSubText} numberOfLines={1}>
                    {item.author ? `By ${item.author}` : item.category}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color={MUTED} />
              </Pressable>
            ))}
          </>
        )}

        {!!papers?.length && (
          <>
            <Text style={styles.sectionTitle}>Previous Year Papers</Text>
            {papers.map((item) => (
              <Pressable key={item.id} style={styles.card} onPress={() => handleOpenPaper(item)}>
                <View style={styles.cardLogoBadge}>
                  {item.categoryIcon ? (
                    <Image
                      source={{ uri: resolveAssetUrl(item.categoryIcon) }}
                      style={styles.cardLogoImg}
                      resizeMode="contain"
                    />
                  ) : (
                    <Ionicons name="document-text-outline" size={22} color={NAVY} />
                  )}
                </View>

                <View style={styles.cardMiddleContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardSubText} numberOfLines={1}>
                    {item.examName} • {item.year}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color={MUTED} />
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
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
  headerTitle: { fontSize: 16, fontWeight: '800', color: NAVY },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 24, paddingTop: 8 },
  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  errorBox: {
    margin: 4,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FBEAE8',
  },
  errorText: { color: ERROR, fontSize: 13, textAlign: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 13, color: MUTED, textAlign: 'center', paddingHorizontal: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: NAVY, marginBottom: 10, marginTop: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 13,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    gap: 12,
  },
  cardLogoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    overflow: 'hidden',
  },
  cardLogoImg: { width: 32, height: 32, borderRadius: 16 },
  cardMiddleContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: NAVY },
  cardSubText: { fontSize: 11.5, color: MUTED, marginTop: 3 },
});
