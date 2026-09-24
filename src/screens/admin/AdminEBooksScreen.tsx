import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminHeader from '../../components/admin/AdminHeader';
import ImagePickerBox from '../../components/admin/ImagePickerBox';
import PdfPickerBox, { PdfUploadResult } from '../../components/admin/PdfPickerBox';
import ToggleRow from '../../components/admin/ToggleRow';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import { resolveAssetUrl } from '../../config/api';
import { AdminNav } from '../../navigation/adminTypes';
import { getCategories } from '../../services/admin/categories.service';
import {
  AdminEbook,
  createAdminEbook,
  deleteAdminEbook,
  getAdminEbooks,
  updateAdminEbook,
  uploadEbookPdf,
} from '../../services/admin/ebook.service';
import { ERROR, MUTED, NAVY, SOFT_SHADOW } from '../../theme/colors';

type Props = {
  token: string;
  nav: AdminNav;
};

export default function AdminEBooksScreen({ token, nav }: Props) {
  const [ebooks, setEbooks] = useState<AdminEbook[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<AdminEbook | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [ebookData, categoryData] = await Promise.all([
        getAdminEbooks(token),
        getCategories(token),
      ]);
      setEbooks(ebookData);
      setCategories(categoryData.filter((c) => c.isActive).map((c) => c.name));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load e-books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setAuthor('');
    setDescription('');
    setCoverImage(null);
    setFileUrl('');
    setFileName('');
    setFileSize(0);
    setIsActive(true);
  };

  const handleOpenAdd = () => {
    setEditing(null);
    resetForm();
    setModalVisible(true);
  };

  const handleOpenEdit = (item: AdminEbook) => {
    setEditing(item);
    setTitle(item.title);
    setCategory(item.category);
    setAuthor(item.author);
    setDescription(item.description);
    setCoverImage(item.coverImage);
    setFileUrl(item.fileUrl);
    setFileName(item.fileUrl.split('/').pop() ?? '');
    setFileSize(item.fileSize);
    setIsActive(item.isActive);
    setModalVisible(true);
  };

  const handlePdfChange = (result: PdfUploadResult | null) => {
    setFileUrl(result?.url ?? '');
    setFileName(result?.fileName ?? '');
    setFileSize(result?.fileSize ?? 0);
  };

  const handleSave = async () => {
    if (!title.trim() || !category || !fileUrl) {
      Alert.alert('Missing details', 'Please fill title, category and upload a PDF.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        category,
        author: author.trim(),
        description: description.trim(),
        coverImage,
        fileUrl,
        fileSize,
        isActive,
      };
      if (editing) {
        await updateAdminEbook(token, editing.id, payload);
      } else {
        await createAdminEbook(token, payload);
      }
      setModalVisible(false);
      load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save e-book');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete E-Book', 'Are you sure you want to delete this e-book?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAdminEbook(token, id);
            load();
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <AdminHeader
        title="E-Books"
        subtitle="Upload E-Book PDFs by category"
        onBack={() => nav.pop()}
        right={
          <Pressable style={styles.addBtn} onPress={handleOpenAdd}>
            <Ionicons name="add" size={24} color="#FFF" />
          </Pressable>
        }
      />

      {loading ? (
        <ActivityIndicator size="large" color={NAVY} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={ebooks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No e-books yet. Tap + to upload one.</Text>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => handleOpenEdit(item)}>
              {item.coverImage ? (
                <Image
                  source={{ uri: resolveAssetUrl(item.coverImage) }}
                  style={styles.coverThumb}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.cardIconWrap}>
                  <Ionicons name="book" size={22} color={NAVY} />
                </View>
              )}
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {item.category}
                  {item.author ? ` • ${item.author}` : ''}
                </Text>
                {!item.isActive && <Text style={styles.inactiveTag}>Inactive</Text>}
              </View>
              <Pressable onPress={() => handleDelete(item.id)} style={styles.iconBtn} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color={ERROR} />
              </Pressable>
            </Pressable>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{editing ? 'Edit E-Book' : 'Upload E-Book'}</Text>
            <ScrollView style={{ width: '100%' }} keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>Title</Text>
              <FormInput
                icon="book-outline"
                placeholder="e.g. Complete General Knowledge 2026"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.pillRow}>
                {categories.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[styles.pill, category === cat && styles.pillActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
                {categories.length === 0 && (
                  <Text style={styles.emptyPillText}>
                    No categories yet. Add one from "Add Category" first.
                  </Text>
                )}
              </View>

              <Text style={styles.inputLabel}>Author (optional)</Text>
              <FormInput
                icon="person-outline"
                placeholder="e.g. Speed Education Team"
                value={author}
                onChangeText={setAuthor}
              />

              <Text style={styles.inputLabel}>Description (optional)</Text>
              <FormInput
                icon="text-outline"
                placeholder="Short summary of what this e-book covers"
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.inputLabel}>Cover Image (optional)</Text>
              <ImagePickerBox
                token={token}
                label="Upload Cover Image"
                value={coverImage}
                onChange={setCoverImage}
                aspectRatio={3 / 4}
              />

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>E-Book PDF File</Text>
              <PdfPickerBox
                label="Tap to upload E-Book PDF"
                fileUrl={fileUrl || null}
                fileName={fileName}
                fileSize={fileSize}
                onUpload={(file) => uploadEbookPdf(token, file)}
                onChange={handlePdfChange}
              />

              <View style={{ marginTop: 16 }}>
                <ToggleRow
                  label="Active"
                  description="Visible for use once display is wired up"
                  value={isActive}
                  onChange={setIsActive}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={[styles.btn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label={editing ? 'Save Changes' : 'Upload E-Book'}
                  onPress={handleSave}
                  loading={saving}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F4EF' },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { padding: 16 },
  emptyText: { textAlign: 'center', color: MUTED, marginTop: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    ...SOFT_SHADOW,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EEF1F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  coverThumb: { width: 44, height: 44, borderRadius: 10, marginRight: 12 },
  cardInfo: { flex: 1, marginRight: 8 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: NAVY },
  cardMeta: { fontSize: 12, color: MUTED, marginTop: 2 },
  inactiveTag: { fontSize: 10.5, fontWeight: '700', color: ERROR, marginTop: 4 },
  iconBtn: { padding: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: NAVY, marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: NAVY, marginTop: 8, marginBottom: 6 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
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
  emptyPillText: { fontSize: 12, color: MUTED },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
    gap: 10,
  },
  btn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  cancelBtn: { backgroundColor: '#E2E8F0' },
  cancelBtnText: { color: NAVY, fontWeight: '700' },
});
