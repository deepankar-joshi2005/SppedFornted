import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { getAdminTeacherInfo, updateAdminTeacherInfo } from '../../services/banner.service';
import { uploadImage } from '../../services/admin/upload.service';
import { NAVY, MUTED, SOFT_SHADOW } from '../../theme/colors';

type Props = { token: string; nav: AdminNav };

export default function AdminTeacherInfoScreen({ token, nav }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [designation, setDesignation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [bio, setBio] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAdminTeacherInfo(token);
      setName(data.name || 'Admin Sir');
      setTitle(data.title || 'Meet the Minds Behind Speed Education');
      setDesignation(data.designation || 'Founder & Chief Instructor');
      setImageUrl(data.imageUrl || '');
      setBio(data.bio || '');
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
        name: asset.fileName ?? `teacher_${Date.now()}.${ext}`,
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
      setImageUrl(url);
    } catch (err) {
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAdminTeacherInfo(token, { name, title, designation, imageUrl, bio });
      Alert.alert('Success', 'Teacher info updated!');
      nav.pop();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => nav.pop()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>Admin / Teacher Info</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={NAVY} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>Header Section Details</Text>

            {/* Photo Picker */}
            <Text style={styles.inputLabel}>Profile Photo</Text>
            <Pressable style={styles.photoPicker} onPress={handlePickImage} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color={NAVY} />
              ) : imageUrl ? (
                <Image source={{ uri: resolveAssetUrl(imageUrl) }} style={styles.photoPreview} resizeMode="cover" />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="person-circle-outline" size={48} color={MUTED} />
                  <Text style={styles.photoPlaceholderText}>Tap to upload photo</Text>
                  <Text style={styles.photoPlaceholderSub}>JPG, JPEG or PNG</Text>
                </View>
              )}
            </Pressable>
            {!!imageUrl && (
              <Pressable onPress={() => setImageUrl('')} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>Remove Photo</Text>
              </Pressable>
            )}

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Admin Sir" value={name} onChangeText={setName} />

            <Text style={styles.inputLabel}>Section Title</Text>
            <TextInput style={styles.input} placeholder="Meet the Minds Behind..." value={title} onChangeText={setTitle} />

            <Text style={styles.inputLabel}>Designation</Text>
            <TextInput style={styles.input} placeholder="Founder & Chief Instructor" value={designation} onChangeText={setDesignation} />

            <Text style={styles.inputLabel}>Bio / Tagline</Text>
            <TextInput style={[styles.input, { height: 80 }]} multiline placeholder="Short bio..." value={bio} onChangeText={setBio} />

            <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving || uploading}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: NAVY },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 18, ...SOFT_SHADOW },
  sectionHeader: { fontSize: 16, fontWeight: '800', color: NAVY, marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: NAVY, marginTop: 12, marginBottom: 4 },
  input: { width: '100%', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, backgroundColor: '#F8FAFC' },
  photoPicker: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#CBD5E1', borderStyle: 'dashed', overflow: 'hidden', alignSelf: 'center', backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  photoPreview: { width: '100%', height: '100%' },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  photoPlaceholderText: { fontSize: 11, color: MUTED, textAlign: 'center' },
  photoPlaceholderSub: { fontSize: 10, color: '#94A3B8' },
  removeBtn: { alignSelf: 'center', marginTop: 6 },
  removeBtnText: { fontSize: 12, color: '#DC2626', fontWeight: '700' },
  saveBtn: { backgroundColor: NAVY, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
});
