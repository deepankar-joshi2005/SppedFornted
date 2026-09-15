import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AdminHeader from '../../components/admin/AdminHeader';
import ImagePickerBox from '../../components/admin/ImagePickerBox';
import StepProgressHeader from '../../components/admin/StepProgressHeader';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import { AdminNav } from '../../navigation/adminTypes';
import { getCategories } from '../../services/admin/categories.service';
import {
  createSeries,
  getSeriesDetail,
  updateSeries,
} from '../../services/admin/series.service';
import { MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  seriesId?: string;
  initialCategory?: string;
  nav: AdminNav;
};

const DIFFICULTIES = ['Easy', 'Moderate', 'Hard', 'Mixed'];

export default function AdminCreateSeriesStep1Screen({
  token,
  seriesId,
  initialCategory,
  nav,
}: Props) {
  const [categories, setCategories] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(initialCategory ?? '');
  const [examTarget, setExamTarget] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState('Mixed');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!seriesId);

  useEffect(() => {
    getCategories(token)
      .then((cats) => setCategories(cats.filter((c) => c.isActive).map((c) => c.name)))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!seriesId) return;
    (async () => {
      try {
        const detail = await getSeriesDetail(token, seriesId);
        setTitle(detail.title);
        setCategory(detail.category);
        setExamTarget(detail.examTarget);
        setDescription(detail.description);
        setShortDescription(detail.shortDescription);
        setBannerImage(detail.bannerImage);
        setDifficulty(detail.difficulty);
      } catch (err) {
        Alert.alert('Failed to load test series', err instanceof Error ? err.message : '');
      } finally {
        setLoading(false);
      }
    })();
  }, [seriesId, token]);

  const handleContinue = async () => {
    if (!title.trim()) {
      Alert.alert('Test series name is required');
      return;
    }
    if (!category) {
      Alert.alert('Please select a category');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        category,
        examTarget,
        description,
        shortDescription,
        bannerImage,
        difficulty,
      };
      const result = seriesId
        ? await updateSeries(token, seriesId, payload)
        : await createSeries(token, payload);
      nav.replace({ name: 'createSeriesStep2', seriesId: result._id });
    } catch (err) {
      Alert.alert('Failed to save', err instanceof Error ? err.message : '');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <AdminHeader title="Create Test Series" onBack={() => nav.pop()} />
      <StepProgressHeader steps={['Basic Info', 'Config', 'Preview']} currentIndex={0} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Test Series Name</Text>
          <FormInput
            icon="folder-open-outline"
            placeholder="SSC CGL 2026 Complete Mock Test Series"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.pillRow}>
            {categories.map((cat) => (
              <Pressable
                key={cat}
                style={[styles.pill, category === cat && styles.pillActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>{cat}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Exam Target</Text>
          <FormInput
            icon="flag-outline"
            placeholder="e.g. SSC CGL"
            value={examTarget}
            onChangeText={setExamTarget}
          />

          <Text style={styles.label}>Description</Text>
          <FormInput
            icon="document-text-outline"
            placeholder="Detailed syllabus, timings & plan details"
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Short Description</Text>
          <FormInput
            icon="text-outline"
            placeholder="Short line for student home feed"
            value={shortDescription}
            onChangeText={setShortDescription}
          />

          <Text style={styles.label}>Upload Cover Banner (16:9)</Text>
          <ImagePickerBox
            token={token}
            label="Upload Cover Banner (16:9)"
            value={bannerImage}
            onChange={setBannerImage}
            aspectRatio={16 / 9}
          />

          <Text style={[styles.label, { marginTop: 18 }]}>Difficulty Level</Text>
          <View style={styles.pillRow}>
            {DIFFICULTIES.map((d) => (
              <Pressable
                key={d}
                style={[styles.pill, difficulty === d && styles.pillActive]}
                onPress={() => setDifficulty(d)}
              >
                <Text style={[styles.pillText, difficulty === d && styles.pillTextActive]}>{d}</Text>
              </Pressable>
            ))}
          </View>

          <PrimaryButton
            label="CONTINUE TO CONFIGURATION"
            onPress={handleContinue}
            loading={saving || loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  scrollContent: { padding: 18, paddingBottom: 40 },
  label: { fontSize: 12.5, fontWeight: '700', color: NAVY, marginBottom: 8, marginTop: 4 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D9D6CC',
    backgroundColor: '#FFFFFF',
  },
  pillActive: { backgroundColor: NAVY, borderColor: NAVY },
  pillText: { fontSize: 12.5, fontWeight: '600', color: MUTED },
  pillTextActive: { color: '#FFFFFF' },
});
