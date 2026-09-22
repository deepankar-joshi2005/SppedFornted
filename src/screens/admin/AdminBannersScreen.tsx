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
  getAdminBanners,
  createAdminBanner,
  updateAdminBanner,
  deleteAdminBanner,
} from '../../services/banner.service';
import { uploadImage } from '../../services/admin/upload.service';
import { BannerItem } from '../../services/dashboard.service';
import { NAVY, MUTED, SOFT_SHADOW } from '../../theme/colors';

type Props = {
  token: string;
  nav: AdminNav;
};

export default function AdminBannersScreen({ token, nav }: Props) {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);

  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAdminBanners(token);
      setBanners(data);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    if (!['jpg', 'jpeg', 'png'].includes(ext)) {
      Alert.alert('Invalid format', 'Only JPG, JPEG and PNG are allowed.');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(token, {
        uri: asset.uri,
        name: asset.fileName ?? `banner_${Date.now()}.${ext}`,
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
      setImageUrl(url);
    } catch (err) {
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setImageUrl(''); setTitle(''); setSubtitle(''); setLinkUrl('');
    setModalVisible(true);
  };

  const handleOpenEdit = (b: BannerItem) => {
    setEditingBanner(b);
    setImageUrl(b.imageUrl || ''); setTitle(b.title || '');
    setSubtitle(b.subtitle || ''); setLinkUrl(b.linkUrl || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingBanner) {
        await updateAdminBanner(token, editingBanner.id, { imageUrl, title, subtitle, linkUrl });
      } else {
        await createAdminBanner(token, { imageUrl: imageUrl || '', title, subtitle, linkUrl });
      }
      setModalVisible(false);
      load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Banner', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteAdminBanner(token, id); load(); }
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
        <Text style={styles.headerTitle}>Manage Home Banners</Text>
        <Pressable style={styles.addBtn} onPress={handleOpenAdd}>
          <Ionicons name="add" size={24} color="#FFF" />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={NAVY} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={banners}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No banners yet. Tap + to add.</Text>}
          renderItem={({ item }) => (
            <View style={styles.bannerCard}>
              {!!item.imageUrl && (
                <Image
                  source={{ uri: resolveAssetUrl(item.imageUrl) }}
                  style={styles.bannerThumb}
                  resizeMode="cover"
                />
              )}
              <View style={styles.bannerInfo}>
                <Text style={styles.bannerTitleText}>{item.title || 'Untitled Banner'}</Text>
                <Text style={styles.bannerSubtitleText} numberOfLines={1}>{item.subtitle || 'No subtitle'}</Text>
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
            <Text style={styles.modalTitle}>{editingBanner ? 'Edit Banner' : 'Add New Banner'}</Text>
            <ScrollView style={{ width: '100%' }}>

              {/* Image Picker */}
              <Text style={styles.inputLabel}>Banner Image</Text>
              <Pressable style={styles.imagePicker} onPress={handlePickImage} disabled={uploading}>
                {uploading ? (
                  <ActivityIndicator color={NAVY} />
                ) : imageUrl ? (
                  <Image source={{ uri: resolveAssetUrl(imageUrl) }} style={styles.imagePreview} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={32} color={MUTED} />
                    <Text style={styles.imagePlaceholderText}>Tap to upload JPG / PNG</Text>
                  </View>
                )}
              </Pressable>
              {!!imageUrl && (
                <Pressable onPress={() => setImageUrl('')} style={styles.removeImgBtn}>
                  <Text style={styles.removeImgText}>Remove Image</Text>
                </Pressable>
              )}

              <Text style={styles.inputLabel}>Title</Text>
              <TextInput style={styles.input} placeholder="Banner Title" value={title} onChangeText={setTitle} />

              <Text style={styles.inputLabel}>Subtitle</Text>
              <TextInput style={styles.input} placeholder="Banner Subtitle" value={subtitle} onChangeText={setSubtitle} />

              <Text style={styles.inputLabel}>Link URL (optional)</Text>
              <TextInput style={styles.input} placeholder="https://..." value={linkUrl} onChangeText={setLinkUrl} />
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={[styles.btn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.saveBtn]} onPress={handleSave} disabled={saving || uploading}>
                {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveBtnText}>Save Banner</Text>}
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderColor: '#E2E8F0',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: NAVY },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16 },
  emptyText: { textAlign: 'center', color: MUTED, marginTop: 40 },
  bannerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 14, marginBottom: 12, ...SOFT_SHADOW },
  bannerThumb: { width: 64, height: 44, borderRadius: 8, marginRight: 12 },
  bannerInfo: { flex: 1, marginRight: 8 },
  bannerTitleText: { fontSize: 14, fontWeight: '800', color: NAVY },
  bannerSubtitleText: { fontSize: 12, color: MUTED, marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', maxHeight: '90%', backgroundColor: '#FFF', borderRadius: 18, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: NAVY, marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: NAVY, marginTop: 12, marginBottom: 4 },
  input: { width: '100%', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, backgroundColor: '#F8FAFC' },
  imagePicker: { width: '100%', height: 160, borderRadius: 12, borderWidth: 2, borderColor: '#CBD5E1', borderStyle: 'dashed', overflow: 'hidden', backgroundColor: '#F8FAFC' },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imagePlaceholderText: { fontSize: 13, color: MUTED },
  removeImgBtn: { alignSelf: 'flex-end', marginTop: 4 },
  removeImgText: { fontSize: 12, color: '#DC2626', fontWeight: '700' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', width: '100%', marginTop: 16, gap: 10 },
  btn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  cancelBtn: { backgroundColor: '#E2E8F0' },
  cancelBtnText: { color: NAVY, fontWeight: '700' },
  saveBtn: { backgroundColor: NAVY },
  saveBtnText: { color: '#FFF', fontWeight: '800' },
});
