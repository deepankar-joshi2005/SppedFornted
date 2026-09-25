import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminHeader from '../../components/admin/AdminHeader';
import ImagePickerBox from '../../components/admin/ImagePickerBox';
import ToggleRow from '../../components/admin/ToggleRow';
import PrimaryButton from '../../components/PrimaryButton';
import FormInput from '../../components/FormInput';
import { AdminNav } from '../../navigation/adminTypes';
import {
  createCategory,
  deleteCategory,
  getCategoryDetail,
  updateCategory,
} from '../../services/admin/categories.service';
import { ERROR, MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  categoryId?: string;
  nav: AdminNav;
};

export default function AdminAddCategoryScreen({ token, categoryId, nav }: Props) {
  const isEdit = !!categoryId;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconImage, setIconImage] = useState<string | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [displayOrder, setDisplayOrder] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [counts, setCounts] = useState({ seriesCount: 0, testCount: 0 });

  useEffect(() => {
    if (!categoryId) return;
    (async () => {
      try {
        const detail = await getCategoryDetail(token, categoryId);
        setName(detail.name);
        setDescription(detail.description);
        setIconImage(detail.iconImage);
        setBannerImage(detail.bannerImage);
        setIsActive(detail.isActive);
        setCounts({ seriesCount: detail.seriesCount, testCount: detail.testCount });
      } catch (err) {
        Alert.alert('Failed to load category', err instanceof Error ? err.message : '');
      } finally {
        setLoading(false);
      }
    })();
  }, [categoryId, token]);

  const handleDelete = () => {
    if (!categoryId) return;
    Alert.alert(
      `Delete "${name}"?`,
      `This will permanently delete this category along with ALL related data — ` +
        `${counts.seriesCount} test series, ${counts.testCount} tests, their questions, ` +
        `student attempt history and purchases. Any PYQ papers or E-Books tagged under this ` +
        `category will be deleted too.\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteCategory(token, categoryId);
              nav.pop();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete category');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Category name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        iconImage,
        bannerImage,
        displayOrder: displayOrder ? Number(displayOrder) : 0,
        isActive,
      };
      if (isEdit && categoryId) {
        await updateCategory(token, categoryId, payload);
      } else {
        await createCategory(token, payload);
      }
      nav.pop();
    } catch (err) {
      Alert.alert('Failed to save category', err instanceof Error ? err.message : '');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <AdminHeader title="Add Category" onBack={() => nav.pop()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Category Name</Text>
          <FormInput icon="grid-outline" placeholder="e.g. SSC" value={name} onChangeText={setName} />

          <Text style={styles.label}>Description</Text>
          <FormInput
            icon="document-text-outline"
            placeholder="e.g. Staff Selection Commission preparation tests"
            value={description}
            onChangeText={setDescription}
          />

          <View style={styles.imageRow}>
            <View style={styles.imageCol}>
              <ImagePickerBox
                token={token}
                label="Category Icon"
                value={iconImage}
                onChange={setIconImage}
                aspectRatio={1}
              />
            </View>
            <View style={styles.imageCol}>
              <ImagePickerBox
                token={token}
                label="Banner Image"
                value={bannerImage}
                onChange={setBannerImage}
                aspectRatio={1}
              />
            </View>
          </View>

          <Text style={styles.label}>Display Order</Text>
          <FormInput
            icon="swap-vertical-outline"
            placeholder="e.g. 1"
            value={displayOrder}
            onChangeText={setDisplayOrder}
            keyboardType="number-pad"
          />

          <ToggleRow label="Category Status" value={isActive} onChange={setIsActive} />

          <Text style={[styles.label, { marginTop: 20 }]}>Student App Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewIconWrap}>
              {iconImage ? (
                <View style={styles.previewIconImage} />
              ) : (
                <Ionicons name="book-outline" size={18} color={NAVY} />
              )}
            </View>
            <View>
              <Text style={styles.previewTitle}>{name || 'Category Name'}</Text>
              <Text style={styles.previewSubtitle}>0 Test Series • 0 Tests</Text>
            </View>
          </View>

          <PrimaryButton
            label={isEdit ? 'UPDATE CATEGORY' : 'SAVE CATEGORY'}
            onPress={handleSave}
            loading={saving || loading}
          />

          {isEdit && (
            <Pressable
              style={styles.deleteBtn}
              onPress={handleDelete}
              disabled={deleting || loading}
            >
              {deleting ? (
                <ActivityIndicator color={ERROR} size="small" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={16} color={ERROR} />
                  <Text style={styles.deleteBtnText}>Delete Category</Text>
                </>
              )}
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  scrollContent: { padding: 18, paddingBottom: 40 },
  label: { fontSize: 12.5, fontWeight: '700', color: NAVY, marginBottom: 8, marginTop: 4 },
  imageRow: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  imageCol: { flex: 1 },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDEBE4',
    marginTop: 8,
    marginBottom: 24,
  },
  previewIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF1F7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewIconImage: { width: '100%', height: '100%', backgroundColor: '#D9D6CC' },
  previewTitle: { fontSize: 14, fontWeight: '800', color: NAVY },
  previewSubtitle: { fontSize: 11.5, color: MUTED, marginTop: 2 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 13,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: ERROR,
  },
  deleteBtnText: {
    color: ERROR,
    fontWeight: '700',
    fontSize: 13.5,
  },
});
