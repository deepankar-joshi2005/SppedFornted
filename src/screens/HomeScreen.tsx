import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationBell from '../components/NotificationBell';
import { resolveAssetUrl } from '../config/api';
import { Nav } from '../navigation/types';
import {
  getDashboard,
  DashboardData,
  DashboardCategory,
  BannerItem,
  LiveMockItem,
  SuccessStoryItem,
  ActivityItem,
} from '../services/dashboard.service';
import { AuthUser } from '../services/auth.service';
import { getEbooks } from '../services/ebook.service';
import { useLanguage } from '../context/LanguageContext';
import { CARD_SHADOW, GOLD, GOLD_TINT, MUTED, NAVY, SOFT_SHADOW } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  user: AuthUser;
  token: string;
  nav: Nav;
  onLogout: () => void;
};

const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

// Quick categories with badges
const QUICK_GRID_ITEMS = [
  { id: 'full', title: 'Full length', icon: 'create-outline', bg: '#E3F2FD', color: '#1E88E5' },
  { id: 'pyp', title: 'PYPs', icon: 'document-text-outline', bg: '#FCE4EC', color: '#E91E63' },
  { id: 'super', title: 'Super Set', badge: 'FREE', badgeBg: '#4CAF50', icon: 'flash-outline', bg: '#F0F4C3', color: '#7CB342' },
  { id: 'ebook', title: 'EBooks', icon: 'library-outline', bg: '#E0F2F1', color: '#00897B' },
  { id: 'live', title: 'Live Mock Test', badge: 'LIVE', badgeBg: '#FF5252', icon: 'journal-outline', bg: '#EDE7F6', color: '#5E35B1' },
  { id: 'sec', title: 'Sectional Test', icon: 'clipboard-outline', bg: '#F3E5F5', color: '#8E24AA' },
];

// Icon color palette — cycles through for dynamic categories
const CATEGORY_COLORS = [
  '#D32F2F', '#C2185B', '#7B1FA2', '#1976D2',
  '#00796B', '#E65100', '#16A34A', '#F57C00',
  '#0288D1', '#5E35B1', '#2E7D32', '#AD1457',
];

// Icon key palette — cycles through for dynamic categories
const CATEGORY_ICONS: string[] = [
  'ribbon-outline', 'school-outline', 'subway-outline', 'shield-checkmark-outline',
  'hardware-chip-outline', 'train-outline', 'shield-outline', 'trophy-outline',
  'book-outline', 'flash-outline', 'star-outline', 'clipboard-outline',
];

export default function HomeScreen({ user, token, nav }: Props) {
  const { t } = useLanguage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Panel state ──────────────────────────────────────────────────────────
  // panelAnim: 0 = closed, 1 = open
  // Uses translateY + opacity with useNativeDriver:true → runs on UI thread → zero lag
  const panelAnim = useRef(new Animated.Value(0)).current;
  const isPanelOpenRef = useRef(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const scrollYRef = useRef(0);

  // Auto-sliding banners index
  const bannerFlatListRef = useRef<FlatList>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // Auto-sliding live mocks index
  const liveMockFlatListRef = useRef<FlatList>(null);
  const [activeLiveMockIndex, setActiveLiveMockIndex] = useState(0);

  // Auto-sliding success stories index
  const storyFlatListRef = useRef<FlatList>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  // Keep ref in sync with animated value at all times
  useEffect(() => {
    const id = panelAnim.addListener(({ value }) => {
      // no-op — not needed with nativeDriver
    });
    return () => panelAnim.removeListener(id);
  }, [panelAnim]);
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getDashboard(token);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const [hasNewEbooks, setHasNewEbooks] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getEbooks(token)
      .then((result) => {
        if (!cancelled) setHasNewEbooks(result.some((e) => e.isNew));
      })
      .catch(() => {
        // best-effort — badge just won't show if this fails
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleGridPress = useCallback(
    (id: string) => {
      if (id === 'pyp') {
        nav.push({ name: 'pypsCategories' });
        return;
      }
      if (id === 'super') {
        nav.push({ name: 'freeTests' });
        return;
      }
      if (id === 'ebook') {
        nav.push({ name: 'ebooks' });
        return;
      }
      nav.resetToTab('tests');
    },
    [nav]
  );

  const snapOpen = () => {
    isPanelOpenRef.current = true;
    setPanelOpen(true);
    Animated.spring(panelAnim, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
  };

  const snapClose = () => {
    isPanelOpenRef.current = false;
    Animated.spring(panelAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start(({ finished }) => {
      if (finished) setPanelOpen(false);
    });
  };

  const toggleHeader = () => {
    if (isPanelOpenRef.current) snapClose(); else snapOpen();
  };

  // Pull-down to open panel — uses RefreshControl gesture (most reliable on Android+iOS)
  // We immediately set refreshing=false so no spinner ever shows
  const handlePullDown = useCallback(() => {
    if (!isPanelOpenRef.current) {
      snapOpen();
    }
  }, []);

  const firstName = user.name.split(' ')[0];

  const teacherInfo = data?.teacherInfo || {
    name: 'Admin Sir',
    title: 'Meet the Minds Behind Speed Education',
    designation: 'Founder & Chief Instructor',
  };

  const bannersList: BannerItem[] = data?.banners?.length ? data.banners : [];

  const liveMocksList: LiveMockItem[] = data?.liveMocks !== undefined
    ? data.liveMocks
    : [
        {
          id: 'lm1',
          title: 'Live Test - SSC CGL Tier 1',
          badgeText: 'All India Sunday Live Mock-9',
          totalQuestions: 100,
          durationMinutes: 60,
          totalMarks: 200,
          isLive: true,
          category: 'SSC',
        },
        {
          id: 'lm2',
          title: 'Live Test - RRB NTPC CBT 1',
          badgeText: 'All India Rail Mock-4',
          totalQuestions: 100,
          durationMinutes: 90,
          totalMarks: 100,
          isLive: true,
          category: 'RRB',
        },
      ];

  const activitiesList: ActivityItem[] = data?.myActivities?.length
    ? data.myActivities
    : data?.continueTest
    ? [
        {
          attemptId: data.continueTest.attemptId,
          testId: data.continueTest.testId,
          title: data.continueTest.title,
          categoryTag: 'RRB NTPC Graduate',
          totalQuestions: data.continueTest.totalQuestions,
          questionsCompleted: data.continueTest.questionsCompleted,
          durationMinutes: 90,
          percent: data.continueTest.percent,
        },
      ]
    : [
        {
          attemptId: 'default-att-1',
          testId: 'default-test-1',
          title: 'NTPC Graduate CBT 1',
          categoryTag: 'RRB NTPC Graduate',
          totalQuestions: 100,
          questionsCompleted: 45,
          durationMinutes: 90,
          percent: 45,
        },
      ];

  const storiesList: SuccessStoryItem[] = data?.successStories?.length
    ? data.successStories
    : [
        {
          id: 's1',
          studentName: 'MD ASIF',
          studentImage: '',
          examTag: '• SSC CGL 2025 Selected',
          reviewText:
            'It is so helpful for me Speed Education team. I am really grateful to Admin sir and for my preparation 🎓🎉❤️',
        },
        {
          id: 's2',
          studentName: 'PRIYA SHARMA',
          studentImage: '',
          examTag: '• RRB NTPC AIR 14',
          reviewText:
            'Speed Education live mock tests helped me boost my speed and confidence tremendously before the exam!',
        },
        {
          id: 's3',
          studentName: 'KUNAL KUMAR',
          studentImage: '',
          examTag: '• SSC CGL 2025 Selected',
          reviewText:
            'It was a wonderful preparation journey of mine with Speed Education. I was blessed to get taught by the teachers!',
        },
      ];

  // Auto-scroll Banners
  useEffect(() => {
    const bannersCount = bannersList.length;
    if (bannersCount <= 1) return;
    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => {
        const nextIndex = (prev + 1) % bannersCount;
        bannerFlatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        return nextIndex;
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [bannersList]);

  // Auto-scroll Live Mocks
  useEffect(() => {
    const liveMocksCount = liveMocksList.length;
    if (liveMocksCount <= 1) return;
    const timer = setInterval(() => {
      setActiveLiveMockIndex((prev) => {
        const nextIndex = (prev + 1) % liveMocksCount;
        liveMockFlatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        return nextIndex;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [liveMocksList]);

  // Auto-scroll Success Stories
  useEffect(() => {
    const storiesCount = storiesList.length;
    if (storiesCount <= 1) return;
    const timer = setInterval(() => {
      setActiveStoryIndex((prev) => {
        const nextIndex = (prev + 1) % storiesCount;
        storyFlatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        return nextIndex;
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [storiesList]);

  const headerMaxHeight = panelAnim;

  // translateY: panel starts at -260 (hidden above), moves to 0 (visible)
  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-220, 0],
  });
  const panelOpacity = panelAnim;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={{ flex: 1 }}>

      {/* ── Fixed Top Header ── */}
      <View style={styles.fixedTopHeader}>
        {/* Welcome Row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcomeText}>{t('welcome_back', 'Welcome back,')}</Text>
            <Text style={styles.helloText}>
              {t('hello', 'Hello,')} {firstName} 👋
            </Text>
          </View>
          <View style={styles.headerActions}>
            <NotificationBell token={token} onPress={() => nav.push({ name: 'notifications' })} />
            <Pressable style={styles.avatar} onPress={() => nav.resetToTab('profile')}>
              <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <Pressable
          style={styles.searchBar}
          onPress={() => nav.resetToTab('tests')}
        >
          <Ionicons name="search-outline" size={18} color={MUTED} />
          <Text style={styles.searchPlaceholder}>
            {t('search_placeholder', 'Search tests, exams or test series...')}
          </Text>
        </Pressable>

        {/* Handle Bar Pill — tap to toggle admin panel */}
        <Pressable style={styles.handleBarWrap} onPress={toggleHeader}>
          <View style={styles.handleBarPill} />
        </Pressable>
      </View>

      {/* ── Slide-down Teacher / Admin Info Panel — translateY with nativeDriver ── */}
      {panelOpen && (
        <Animated.View
          style={[
            styles.collapsibleHeaderBox,
            {
              transform: [{ translateY: panelTranslateY }],
            },
          ]}
          pointerEvents="auto"
        >
          <View style={styles.teacherSectionContainer}>
            <Text style={styles.teacherHeaderTitle} numberOfLines={1}>
              Meet the Minds Behind <Text style={styles.speedEduHighlight}>Speed Education</Text>
            </Text>
            <View style={styles.singleAdminCard}>
              <View style={styles.adminImageWrap}>
                {teacherInfo.imageUrl ? (
                  <Image
                    source={{ uri: resolveAssetUrl(teacherInfo.imageUrl) }}
                    style={styles.adminImage}
                  />
                ) : (
                  <View style={styles.adminImagePlaceholder}>
                    <Ionicons name="person" size={36} color={NAVY} />
                  </View>
                )}
              </View>
              <View style={styles.adminInfoTextWrap}>
                <Text style={styles.adminNameText}>{teacherInfo.name.toUpperCase()}</Text>
                <Text style={styles.adminDesignationText}>{teacherInfo.designation}</Text>
                <Text style={styles.adminSubjectTag}>Speed Education Head</Text>
              </View>
            </View>
            <Pressable style={styles.closePanelBtn} onPress={snapClose}>
              <Ionicons name="chevron-up" size={18} color={NAVY} />
              <Text style={styles.closePanelText}>Close</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Dim overlay — driven by panelAnim directly so it fades with panel, zero delay */}
      {panelOpen && (
        <Animated.View
          style={[styles.panelDimOverlay, { opacity: panelOpacity }]}
          pointerEvents="auto"
        >
          <Pressable style={{ flex: 1 }} onPress={snapClose} />
        </Animated.View>
      )}

      {/* ── Scrollable Content ── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={(e) => {
          scrollYRef.current = e.nativeEvent.contentOffset.y;
        }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handlePullDown}
            tintColor="transparent"
            colors={['transparent']}
            progressBackgroundColor="transparent"
            progressViewOffset={-100}
          />
        }
      >
        {loading && !data && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={NAVY} size="large" />
          </View>
        )}

        {!!error && !data && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => load()}>
              <Text style={styles.retryText}>{t('retry', 'Tap to retry')}</Text>
            </Pressable>
          </View>
        )}

        {/* Top Banners Carousel */}
        {bannersList.length > 0 && (
          <View style={styles.bannersSection}>
            <FlatList
              ref={bannerFlatListRef}
              data={bannersList}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 36));
                setActiveBannerIndex(index);
              }}
              renderItem={({ item }) => (
                <View style={styles.bannerCardContainer}>
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: resolveAssetUrl(item.imageUrl) }}
                      style={styles.bannerImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.bannerGradientCard}>
                      <View style={styles.bannerBadgeRow}>
                        <View style={styles.bannerLogoBadge}>
                          <Ionicons name="trending-up" size={14} color="#FFF" />
                          <Text style={styles.bannerLogoText}>Speed Education</Text>
                        </View>
                        {item.tag && <Text style={styles.bannerTagText}>{item.tag}</Text>}
                      </View>
                      <Text style={styles.bannerMainTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.bannerSubTitle} numberOfLines={2}>
                        {item.subtitle}
                      </Text>
                      <View style={styles.bannerActionRow}>
                        <View style={styles.prizePill}>
                          <Text style={styles.prizePillText}>SPECIAL TEST</Text>
                        </View>
                        <Pressable
                          style={styles.watchVideoBtn}
                          onPress={() => nav.resetToTab('tests')}
                        >
                          <Ionicons name="play-circle" size={16} color="#FFF" />
                          <Text style={styles.watchVideoText}>START NOW</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              )}
            />
            {/* Banner Indicators */}
            <View style={styles.indicatorRow}>
              {bannersList.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.indicatorDot,
                    activeBannerIndex === i && styles.indicatorDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Quick Test Types Grid */}
        <View style={styles.quickGridCard}>
          <View style={styles.quickGridRow}>
            {QUICK_GRID_ITEMS.slice(0, 4).map((item) => {
              const badgeText = item.badge ?? (item.id === 'ebook' && hasNewEbooks ? 'NEW' : undefined);
              const badgeBg = item.badgeBg ?? '#7C4DFF';
              return (
                <Pressable
                  key={item.id}
                  style={styles.quickGridItem}
                  onPress={() => handleGridPress(item.id)}
                >
                  {badgeText && (
                    <View style={[styles.gridBadge, { backgroundColor: badgeBg }]}>
                      <Text style={styles.gridBadgeText}>{badgeText}</Text>
                    </View>
                  )}
                  <View style={[styles.gridIconBox, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                  </View>
                  <Text style={styles.gridItemLabel}>{item.title}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.quickGridRow}>
            {QUICK_GRID_ITEMS.slice(4).map((item) => {
              const badgeText = item.badge ?? (item.id === 'ebook' && hasNewEbooks ? 'NEW' : undefined);
              const badgeBg = item.badgeBg ?? '#7C4DFF';
              return (
                <Pressable
                  key={item.id}
                  style={styles.quickGridItem}
                  onPress={() => handleGridPress(item.id)}
                >
                  {badgeText && (
                    <View style={[styles.gridBadge, { backgroundColor: badgeBg }]}>
                      <Text style={styles.gridBadgeText}>{badgeText}</Text>
                    </View>
                  )}
                  <View style={[styles.gridIconBox, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                  </View>
                  <Text style={styles.gridItemLabel}>{item.title}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Live Mocks Section */}
        {liveMocksList.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleWithAccent}>
                <View style={styles.blueAccentBar} />
                <View style={styles.freeBadgePill}>
                  <Text style={styles.freeBadgeText}>FREE</Text>
                </View>
                <Text style={styles.sectionTitleText}>Live Mocks</Text>
              </View>
            </View>

            <View style={styles.liveMocksContainer}>
              <FlatList
                ref={liveMockFlatListRef}
                data={liveMocksList}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 36));
                  setActiveLiveMockIndex(index);
                }}
                renderItem={({ item }) => (
                  <View style={styles.liveMockCard}>
                    <View style={styles.liveMockHeaderRow}>
                      <Text style={styles.liveMockTitle}>{item.title}</Text>
                      <View style={styles.liveBadge}>
                        <Text style={styles.liveBadgeText}>LIVE</Text>
                      </View>
                      <Ionicons name="information-circle-outline" size={18} color={MUTED} style={styles.infoIcon} />
                    </View>

                    <View style={styles.liveMockSubPill}>
                      <Text style={styles.liveMockSubPillText}>• {item.badgeText}</Text>
                    </View>

                    <View style={styles.liveMockDetailsRow}>
                      <View style={styles.mockStatCol}>
                        <Text style={styles.mockStatValue}>{item.totalQuestions}</Text>
                        <Text style={styles.mockStatLabel}>Ques</Text>
                      </View>
                      <View style={styles.mockDivider} />
                      <View style={styles.mockStatCol}>
                        <Text style={styles.mockStatValue}>{item.durationMinutes}</Text>
                        <Text style={styles.mockStatLabel}>mins</Text>
                      </View>
                      <View style={styles.mockDivider} />
                      <View style={styles.mockStatCol}>
                        <Text style={styles.mockStatValue}>{item.totalMarks}.0</Text>
                        <Text style={styles.mockStatLabel}>Marks</Text>
                      </View>

                      <Pressable
                        style={styles.startTestGreenBtn}
                        onPress={() => nav.push({ name: 'testInstructions', testId: item.id })}
                      >
                        <Text style={styles.startTestGreenText}>Start Test</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              />
              {/* Live Mock Indicators */}
              <View style={styles.indicatorRow}>
                {liveMocksList.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.indicatorDot,
                      activeLiveMockIndex === i && styles.indicatorDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          </>
        )}

        {/* Trending Exams Section — Dynamic from admin categories */}
        {(data?.categories?.length ?? 0) > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleWithAccent}>
                <View style={styles.blueAccentBar} />
                <Text style={styles.sectionTitleText}>Trending exams</Text>
              </View>
            </View>

            <View style={styles.trendingGridCard}>
              {/* Render categories in rows of 4 */}
              {Array.from({
                length: Math.ceil(Math.min(data!.categories.length, 8) / 4),
              }).map((_, rowIdx) => {
                const rowItems = data!.categories.slice(rowIdx * 4, rowIdx * 4 + 4);
                // On last row, if less than 4 items, add "Show All" button
                const isLastRow = rowIdx === Math.ceil(Math.min(data!.categories.length, 8) / 4) - 1;
                const showShowAll = isLastRow && rowItems.length < 4;
                return (
                  <View
                    key={rowIdx}
                    style={[styles.trendingGridRow, rowIdx > 0 && { marginTop: 16 }]}
                  >
                    {rowItems.map((cat, idx) => {
                      const globalIdx = rowIdx * 4 + idx;
                      const iconName = CATEGORY_ICONS[globalIdx % CATEGORY_ICONS.length];
                      const iconColor = CATEGORY_COLORS[globalIdx % CATEGORY_COLORS.length];
                      return (
                        <Pressable
                          key={cat.name}
                          style={styles.trendingItem}
                          onPress={() => nav.push({ name: 'testList', category: cat.name })}
                        >
                          {cat.iconImage ? (
                            <View style={styles.trendingIconCircle}>
                              <Image
                                source={{ uri: resolveAssetUrl(cat.iconImage) }}
                                style={{ width: 26, height: 26, borderRadius: 13 }}
                                resizeMode="cover"
                              />
                            </View>
                          ) : (
                            <View style={styles.trendingIconCircle}>
                              <Ionicons name={iconName as any} size={22} color={iconColor} />
                            </View>
                          )}
                          <Text style={styles.trendingLabel} numberOfLines={2}>
                            {cat.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                    {showShowAll && (
                      <Pressable
                        style={styles.trendingItem}
                        onPress={() => nav.resetToTab('tests')}
                      >
                        <View style={[styles.trendingIconCircle, { backgroundColor: '#F0F2F5' }]}>
                          <Ionicons name="chevron-forward" size={20} color={NAVY} />
                        </View>
                        <Text style={styles.trendingShowAllLabel}>Show All</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}

              {/* Show All button on its own row if categories fill all 8 slots */}
              {data!.categories.length >= 8 && (
                <View style={[styles.trendingGridRow, { marginTop: 16 }]}>
                  <Pressable
                    style={styles.trendingItem}
                    onPress={() => nav.resetToTab('tests')}
                  >
                    <View style={[styles.trendingIconCircle, { backgroundColor: '#F0F2F5' }]}>
                      <Ionicons name="chevron-forward" size={20} color={NAVY} />
                    </View>
                    <Text style={styles.trendingShowAllLabel}>Show All</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </>
        )}

        {/* My Activities Section */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithAccent}>
            <View style={styles.blueAccentBar} />
            <Text style={styles.sectionTitleText}>My Activities</Text>
          </View>
        </View>

        <View style={styles.activitiesContainer}>
          <View style={styles.lastTestBadge}>
            <Text style={styles.lastTestBadgeText}>Last Test</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {activitiesList.map((item, idx) => (
              <View style={styles.activityCard} key={idx}>
                <Text style={styles.activityTitle}>{item.title}</Text>

                <View style={styles.activityPillTag}>
                  <Text style={styles.activityPillText}>• {item.categoryTag}</Text>
                </View>

                <View style={styles.activityFooterRow}>
                  <Text style={styles.activityStatsText}>
                    {item.totalQuestions} Ques   |   {item.durationMinutes} mins
                  </Text>

                  <Pressable
                    style={styles.resumeGoldBtn}
                    onPress={() =>
                      nav.push({
                        name: 'testTaking',
                        attemptId: item.attemptId,
                        testId: item.testId,
                      })
                    }
                  >
                    <Text style={styles.resumeGoldText}>Resume Test</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Success Stories Section */}
        <Pressable
          style={styles.sectionHeaderRow}
          onPress={() => nav.push({ name: 'studentReviews' })}
        >
          <View style={styles.sectionTitleWithAccent}>
            <View style={styles.blueAccentBar} />
            <Text style={styles.sectionTitleText}>Success Stories</Text>
          </View>
        </Pressable>

        <View style={styles.storiesContainer}>
          <FlatList
            ref={storyFlatListRef}
            data={storiesList}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            getItemLayout={(_data, index) => ({
              length: SCREEN_WIDTH - 36,
              offset: (SCREEN_WIDTH - 36) * index,
              index,
            })}
            onScrollToIndexFailed={(info) => {
              storyFlatListRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: true,
              });
            }}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 36));
              setActiveStoryIndex(index);
            }}
            renderItem={({ item }) => (
              <Pressable
                style={styles.storyCard}
                onPress={() => nav.push({ name: 'studentReviews' })}
              >
                <View style={styles.storyHeaderRow}>
                  {item.studentImage ? (
                    <Image
                      source={{ uri: resolveAssetUrl(item.studentImage) }}
                      style={styles.storyAvatar}
                    />
                  ) : (
                    <View style={styles.storyAvatarPlaceholder}>
                      <Text style={styles.storyAvatarText}>{getInitials(item.studentName)}</Text>
                    </View>
                  )}
                  <View style={styles.storyMetaWrap}>
                    <Text style={styles.storyStudentName}>{item.studentName}</Text>
                    <Text style={styles.storyExamTag}>{item.examTag}</Text>
                  </View>
                </View>
                <Text style={styles.storyReviewText}>{item.reviewText}</Text>
              </Pressable>
            )}
          />

          <Pressable
            style={styles.viewAllReviewsBtn}
            onPress={() => nav.push({ name: 'studentReviews' })}
          >
            <Text style={styles.viewAllReviewsText}>View All Reviews</Text>
          </Pressable>
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  fixedTopHeader: {
    backgroundColor: '#F5F6FA',
    paddingHorizontal: 18,
    paddingTop: 12,
    zIndex: 10,
  },
  panelDimOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 8,
  },
  closePanelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 4,
  },
  closePanelText: {
    fontSize: 12,
    fontWeight: '700',
    color: NAVY,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  welcomeText: {
    fontSize: 13,
    color: MUTED,
  },
  helloText: {
    fontSize: 19,
    fontWeight: '800',
    color: NAVY,
    marginTop: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: NAVY,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginTop: 14,
    gap: 8,
    ...CARD_SHADOW,
  },
  searchPlaceholder: {
    fontSize: 13,
    color: '#9AA3B2',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FBEAE8',
    alignItems: 'center',
  },
  errorText: {
    color: '#C0392B',
    fontSize: 13,
    textAlign: 'center',
  },
  retryText: {
    marginTop: 8,
    color: NAVY,
    fontWeight: '700',
    fontSize: 12.5,
  },
  handleBarWrap: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 6,
  },
  handleBarPill: {
    width: 46,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B0BEC5',
  },
  collapsibleHeaderBox: {
    position: 'absolute',
    top: 145,
    left: 0,
    right: 0,
    height: 220,
    overflow: 'hidden',
    backgroundColor: '#F5F6FA',
    zIndex: 9,
    paddingHorizontal: 14,
  },
  teacherSectionContainer: {
    backgroundColor: '#EBF3FE',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    alignItems: 'center',
  },
  teacherHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
    marginBottom: 8,
  },
  speedEduHighlight: {
    color: '#1A73E8',
  },
  singleAdminCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    width: '98%',
    alignItems: 'center',
    ...SOFT_SHADOW,
  },
  adminImageWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1A73E8',
    marginBottom: 6,
  },
  adminImage: {
    width: '100%',
    height: '100%',
  },
  adminImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminInfoTextWrap: {
    alignItems: 'center',
  },
  adminNameText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: NAVY,
  },
  adminDesignationText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1A73E8',
    marginTop: 2,
  },
  adminSubjectTag: {
    fontSize: 10.5,
    color: MUTED,
    marginTop: 1,
  },
  bannersSection: {
    marginTop: 6,
  },
  bannerCardContainer: {
    width: SCREEN_WIDTH - 36,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerGradientCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1E1B4B',
    padding: 14,
    justifyContent: 'space-between',
    borderRadius: 16,
  },
  bannerBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerLogoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#312E81',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  bannerLogoText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  bannerTagText: {
    color: '#FCD34D',
    fontSize: 10.5,
    fontWeight: '700',
  },
  bannerMainTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 0.3,
  },
  bannerSubTitle: {
    fontSize: 11,
    color: '#E0E7FF',
  },
  bannerActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prizePill: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  prizePillText: {
    color: '#FFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  watchVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  watchVideoText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  indicatorDot: {
    width: 20,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  indicatorDotActive: {
    backgroundColor: '#4F46E5',
    width: 28,
  },
  quickGridCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 14,
    marginTop: 18,
    gap: 14,
  },
  quickGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  quickGridItem: {
    alignItems: 'center',
    width: '23%',
    position: 'relative',
  },
  gridBadge: {
    position: 'absolute',
    top: -6,
    right: 4,
    zIndex: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gridBadgeText: {
    color: '#FFF',
    fontSize: 8.5,
    fontWeight: '900',
  },
  gridIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  gridItemLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: NAVY,
    textAlign: 'center',
  },
  sectionHeaderRow: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitleWithAccent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blueAccentBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#2563EB',
  },
  freeBadgePill: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
  },
  liveMocksContainer: {
    marginTop: 4,
  },
  liveMockCard: {
    width: SCREEN_WIDTH - 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SOFT_SHADOW,
  },
  liveMockHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveMockTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: NAVY,
    flex: 1,
  },
  liveBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  liveBadgeText: {
    color: '#FFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  infoIcon: {
    marginLeft: 4,
  },
  liveMockSubPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  liveMockSubPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  liveMockDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  mockStatCol: {
    alignItems: 'center',
  },
  mockStatValue: {
    fontSize: 13,
    fontWeight: '800',
    color: NAVY,
  },
  mockStatLabel: {
    fontSize: 10.5,
    color: MUTED,
  },
  mockDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
  },
  startTestGreenBtn: {
    backgroundColor: '#15803D',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },
  startTestGreenText: {
    color: '#FFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  trendingGridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    ...SOFT_SHADOW,
  },
  trendingGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  trendingItem: {
    alignItems: 'center',
    width: '23%',
  },
  trendingIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  trendingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: NAVY,
    textAlign: 'center',
  },
  trendingShowAllLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
  },
  activitiesContainer: {
    backgroundColor: '#D1D5DB',
    borderRadius: 16,
    padding: 16,
  },
  lastTestBadge: {
    backgroundColor: '#6D28D9',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  lastTestBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  activityCard: {
    width: SCREEN_WIDTH - 68,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginRight: 10,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: NAVY,
  },
  activityPillTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  activityPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  activityFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  activityStatsText: {
    fontSize: 11.5,
    color: MUTED,
  },
  resumeGoldBtn: {
    backgroundColor: '#CA8A04',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resumeGoldText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  storiesContainer: {
    marginTop: 4,
  },
  storyCard: {
    width: SCREEN_WIDTH - 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    ...SOFT_SHADOW,
  },
  storyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  storyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  storyAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
  },
  storyMetaWrap: {
    marginLeft: 12,
  },
  storyStudentName: {
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
  },
  storyExamTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 2,
  },
  storyReviewText: {
    fontSize: 12.5,
    color: '#374151',
    lineHeight: 18,
  },
  viewAllReviewsBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  viewAllReviewsText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
