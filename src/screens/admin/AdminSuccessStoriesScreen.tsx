import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
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
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resolveAssetUrl } from '../../config/api';
import { AdminNav } from '../../navigation/adminTypes';
import {
  getAdminSuccessStories,
  createAdminSuccessStory,
  updateAdminSuccessStory,
  deleteAdminSuccessStory,
} from '../../services/banner.service';
import { uploadImage } from '../../services/admin/upload.service';
import { SuccessStoryItem } from '../../services/dashboard.service';
import { NAVY, MUTED, SOFT_SHADOW } from '../../theme/colors';

type Props = { token: string; nav: AdminNav };

export default function AdminSuccessStoriesScreen({ token, nav }: Props) {
  const [stories, setStories] = useState<SuccessStoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStory, setEditingStory] = useState<SuccessStoryItem | null>(null);

  const [studentName, setStudentName] = useState('');
  const [examTag, setExamTag] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [studentImage, setStudentImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAdminSuccessStories(token);
      setStories(data);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission required', 'Allow photo library access.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.85, allowsEditing: true, aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    if (!['jpg', 'jpeg', 'png'].includes(ext)) { Alert.alert('Invalid format', 'Only JPG, JPEG, PNG allowed.'); return; }
    setUploading(true);
    try {
      const url = await uploadImage(token, {
        uri: asset.uri,
        name: asset.fileName ?? `story_${Date.now()}.${ext}`,
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
      setStudentImage(url);
    } catch (err) {
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingStory(null);
    setStudentName(''); setExamTag(''); setReviewText(''); setStudentImage('');
    setModalVisible(true);
  };

  const handleOpenEdit = (s: SuccessStoryItem) => {
    setEditingStory(s);
    setStudentName(s.studentName || ''); setExamTag(s.examTag || '');
    setReviewText(s.reviewText || ''); setStudentImage(s.studentImage || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!studentName || !examTag || !reviewText) {
      Alert.alert('Validation', 'Student name, exam tag and review are required.');
      return;
    }
    setSaving(true);
    try {
      if (editingStory) {
        await updateAdminSuccessStory(token, editingStory.id, { studentName, examTag, reviewText, studentImage });
      } else {
        await createAdminSuccessStory(token, { studentName, examTag, reviewText, studentImage });
      }
      setModalVisible(false);
      load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Story', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteAdminSuccessStory(token, id); load(); }
        catch (err) { Alert.alert('Error', err instanceof Error ? err.message : 'Failed'); }
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => nav.pop()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Success Stories</Text>
        <Pressable style={styles.addBtn} onPress={handleOpenAdd}>
          <Ionicons name="add" size={24} color="#FFF" />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={NAVY} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={stories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No stories yet. Tap + to add.</Text>}
          renderItem={({ item }) => (
            <View style={styles.storyCard}>
              {item.studentImage ? (
                <Image source={{ uri: resolveAssetUrl(item.studentImage) }} style={styles.storyThumb} resizeMode="cover" />
              ) : (
                <View style={styles.storyThumbPlaceholder}>
                  <Ionicons name="person" size={20} color={MUTED} />
                </View>
              )}
              <View style={styles.storyInfo}>
                <Text style={styles.studentNameText}>{item.studentName}</Text>
                <Text style={styles.examTagText}>{item.examTag}</Text>
                <Text style={styles.reviewText} numberOfLines={2}>"{item.reviewText}"</Text>
              </View>
              <View style={styles.cardActions}>
                <Pressable onPress={() => handleOpenEdit(item)} style={styles.iconBtn}>
                  <Ionicons name="pencil-outline" size={20} color={NAVY} />
                </Pressable>
                <Pressable onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{editingStory ? 'Edit Story' : 'Add Success Story'}</Text>
            <ScrollView style={{ width: '100%' }}>

              {/* Photo Picker */}
              <Text style={styles.inputLabel}>Student Photo</Text>
              <Pressable style={styles.photoPicker} onPress={handlePickImage} disabled={uploading}>
                {uploading ? (
                  <ActivityIndicator color={NAVY} />
                ) : studentImage ? (
                  <Image source={{ uri: resolveAssetUrl(studentImage) }} style={styles.photoPreview} resizeMode="cover" />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="person-circle-outline" size={36} color={MUTED} />
                    <Text style={styles.photoPlaceholderText}>Tap to upload JPG / PNG</Text>
                  </View>
                )}
              </Pressable>
              {!!studentImage && (
                <Pressable onPress={() => setStudentImage('')} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>Remove Photo</Text>
                </Pressable>
              )}

              <Text style={styles.inputLabel}>Student Name</Text>
              <TextInput style={styles.input} placeholder="e.g. MD ASIF" value={studentName} onChangeText={setStudentName} />

              <Text style={styles.inputLabel}>Exam / Selection Tag</Text>
              <TextInput style={styles.input} placeholder="e.g. • SSC CGL 2025 Selected" value={examTag} onChangeText={setExamTag} />

              <Text style={styles.inputLabel}>Review / Description</Text>
              <TextInput style={[styles.input, { height: 80 }]} multiline placeholder="Student feedback..." value={reviewText} onChangeText={setReviewText} />
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={[styles.btn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.saveBtn]} onPress={handleSave} disabled={saving || uploading}>
                {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveBtnText}>Save Story</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: NAVY },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16 },
  emptyText: { textAlign: 'center', color: MUTED, marginTop: 40 },
  storyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 14, marginBottom: 12, ...SOFT_SHADOW },
  storyThumb: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  storyThumbPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  storyInfo: { flex: 1, marginRight: 8 },
  studentNameText: { fontSize: 14, fontWeight: '800', color: NAVY },
  examTagText: { fontSize: 12, fontWeight: '700', color: '#2563EB', marginTop: 2 },
  reviewText: { fontSize: 12, color: MUTED, marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', maxHeight: '90%', backgroundColor: '#FFF', borderRadius: 18, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: NAVY, marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: NAVY, marginTop: 12, marginBottom: 4 },
  input: { width: '100%', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, backgroundColor: '#F8FAFC' },
  photoPicker: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#CBD5E1', borderStyle: 'dashed', overflow: 'hidden', alignSelf: 'center', backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  photoPreview: { width: '100%', height: '100%' },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  photoPlaceholderText: { fontSize: 10, color: MUTED, textAlign: 'center' },
  removeBtn: { alignSelf: 'center', marginTop: 6 },
  removeBtnText: { fontSize: 12, color: '#DC2626', fontWeight: '700' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', width: '100%', marginTop: 16, gap: 10 },
  btn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  cancelBtn: { backgroundColor: '#E2E8F0' },
  cancelBtnText: { color: NAVY, fontWeight: '700' },
  saveBtn: { backgroundColor: NAVY },
  saveBtnText: { color: '#FFF', fontWeight: '800' },
});
