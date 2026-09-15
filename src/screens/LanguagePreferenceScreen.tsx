import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Nav } from '../navigation/types';
import { useLanguage } from '../context/LanguageContext';
import {
  getProfile,
  Language,
  LANGUAGES,
  updateLanguage,
} from '../services/profile.service';
import { ERROR, GOLD, MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  nav: Nav;
};

const NATIVE_NAMES: Record<Language, string> = {
  English: 'English',
  Hindi: 'हिन्दी',
  Tamil: 'தமிழ்',
  Telugu: 'తెలుగు',
  Bengali: 'বাংলা',
};

export default function LanguagePreferenceScreen({ token, nav }: Props) {
  const { language, setLanguage, t } = useLanguage();
  const [selected, setSelected] = useState<Language>(language);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const profile = await getProfile(token);
        if (profile.preferredLanguage) {
          setSelected(profile.preferredLanguage);
          setLanguage(profile.preferredLanguage);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preference.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, setLanguage]);

  const handleSelect = async (lang: Language) => {
    if (lang === selected) return;
    const previous = selected;
    setSelected(lang);
    setLanguage(lang);
    setSaving(true);
    setError('');
    try {
      await updateLanguage(token, lang);
    } catch (err) {
      setSelected(previous);
      setLanguage(previous);
      setError(err instanceof Error ? err.message : 'Failed to save language.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('language_pref_title', 'Language Preferences')}</Text>
        <View style={styles.iconBtn} />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={NAVY} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.subtitle}>
            {t('language_pref_subtitle', "Choose the language you'd like to use across the app.")}
          </Text>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          {LANGUAGES.map((lang) => {
            const isSelected = selected === lang;
            return (
              <Pressable
                key={lang}
                style={[styles.row, isSelected && styles.rowSelected]}
                onPress={() => handleSelect(lang)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{lang}</Text>
                  <Text style={styles.rowNative}>{NATIVE_NAMES[lang]}</Text>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={22} color={GOLD} />}
              </Pressable>
            );
          })}

          {saving && <ActivityIndicator color={NAVY} size="small" style={{ marginTop: 10 }} />}
        </ScrollView>
      )}
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
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 30,
  },
  subtitle: {
    fontSize: 12.5,
    color: MUTED,
    lineHeight: 18,
    marginBottom: 16,
  },
  errorText: {
    color: ERROR,
    fontSize: 12.5,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.3,
    borderColor: '#EDEBE4',
    marginBottom: 10,
  },
  rowSelected: {
    borderColor: GOLD,
    backgroundColor: '#FBF7EC',
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: NAVY,
  },
  rowNative: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  note: {
    fontSize: 11,
    color: MUTED,
    marginTop: 12,
    lineHeight: 16,
  },
});
