import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminHeader from '../../components/admin/AdminHeader';
import PdfPickerBox, { PdfUploadResult } from '../../components/admin/PdfPickerBox';
import ToggleRow from '../../components/admin/ToggleRow';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import { AdminNav } from '../../navigation/adminTypes';
import { getCategories } from '../../services/admin/categories.service';
import {
  AdminPyq,
  createAdminPyq,
  deleteAdminPyq,
  getAdminPyqs,
  updateAdminPyq,
  uploadPyqPdf,
} from '../../services/admin/pyq.service';
import { ERROR, MUTED, NAVY, SOFT_SHADOW } from '../../theme/colors';

type Props = {
  token: string;
  nav: AdminNav;
};

export default function AdminPYQScreen({ token, nav }: Props) {
  const [pyqs, setPyqs] = useState<AdminPyq[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<AdminPyq | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [examName, setExamName] = useState('');
  const [year, setYear] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [pyqData, categoryData] = await Promise.all([
        getAdminPyqs(token),
        getCategories(token),
      ]);
      setPyqs(pyqData);
      setCategories(categoryData.filter((c) => c.isActive).map((c) => c.name));
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load PYQ papers');
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
    setExamName('');
    setYear('');
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

  const handleOpenEdit = (item: AdminPyq) => {
    setEditing(item);
    setTitle(item.title);
    setCategory(item.category);
    setExamName(item.examName);
    setYear(String(item.year));
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
    if (!title.trim() || !category || !examName.trim() || !year.trim() || !fileUrl) {
      Alert.alert('Missing details', 'Please fill title, category, exam name, year and upload a PDF.');
      return;
    }
    const yearNum = Number(year);
    if (!Number.isFinite(yearNum) || yearNum < 1990 || yearNum > 2100) {
      Alert.alert('Invalid year', 'Please enter a valid exam year.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        category,
        examName: examName.trim(),
        year: yearNum,
        fileUrl,
        fileSize,
        isActive,
      };
      if (editing) {
        await updateAdminPyq(token, editing.id, payload);
      } else {
        await createAdminPyq(token, payload);
      }
      setModalVisible(false);
      load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save PYQ paper');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete PYQ Paper', 'Are you sure you want to delete this paper?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAdminPyq(token, id);
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
        title="Previous Year Papers"
        subtitle="Upload PYQ PDFs by category & exam"
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
          data={pyqs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No PYQ papers yet. Tap + to upload one.</Text>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => handleOpenEdit(item)}>
              <View style={styles.cardIconWrap}>
                <Ionicons name="document-text" size={22} color={NAVY} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {item.examName} • {item.category} • {item.year}
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
            <Text style={styles.modalTitle}>{editing ? 'Edit PYQ Paper' : 'Upload PYQ Paper'}</Text>
            <ScrollView style={{ width: '100%' }} keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>Title</Text>
              <FormInput
                icon="document-text-outline"
                placeholder="e.g. SSC CGL Tier-1 2023 Previous Year Paper"
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

              <Text style={styles.inputLabel}>Exam Name</Text>
              <FormInput
                icon="flag-outline"
                placeholder="e.g. SSC CGL, IBPS PO"
                value={examName}
                onChangeText={setExamName}
              />

              <Text style={styles.inputLabel}>Year</Text>
              <FormInput
                icon="calendar-outline"
                placeholder="e.g. 2023"
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
              />

              <Text style={styles.inputLabel}>PYQ PDF File</Text>
              <PdfPickerBox
                label="Tap to upload PYQ PDF"
                fileUrl={fileUrl || null}
                fileName={fileName}
                fileSize={fileSize}
                onUpload={(file) => uploadPyqPdf(token, file)}
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
                  label={editing ? 'Save Changes' : 'Upload Paper'}
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
