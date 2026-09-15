import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import AdminHeader from '../../components/admin/AdminHeader';
import ImagePickerBox from '../../components/admin/ImagePickerBox';
import ToggleRow from '../../components/admin/ToggleRow';
import PrimaryButton from '../../components/PrimaryButton';
import FormInput from '../../components/FormInput';
import { AdminNav } from '../../navigation/adminTypes';
import {
  createCategory,
  getCategoryDetail,
  updateCategory,
} from '../../services/admin/categories.service';
import { MUTED, NAVY } from '../../theme/colors';

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
      } catch (err) {
        Alert.alert('Failed to load category', err instanceof Error ? err.message : '');
      } finally {
        setLoading(false);
      }
    })();
  }, [categoryId, token]);

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
    <View style={styles.root}>
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
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
});
