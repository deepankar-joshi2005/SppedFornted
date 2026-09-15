import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { resolveAssetUrl } from '../../config/api';
import { uploadImage } from '../../services/admin/upload.service';
import { MUTED, NAVY } from '../../theme/colors';

type Props = {
  token: string;
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  aspectRatio?: number;
};

export default function ImagePickerBox({ token, label, value, onChange, aspectRatio }: Props) {
  const [uploading, setUploading] = useState(false);

  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to upload an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const url = await uploadImage(token, {
        uri: asset.uri,
        name: asset.fileName ?? `image-${Date.now()}.jpg`,
        mimeType: asset.mimeType,
      });
      onChange(url);
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Pressable
      style={[styles.box, aspectRatio ? { aspectRatio } : null]}
      onPress={pick}
      disabled={uploading}
    >
      {uploading ? (
        <ActivityIndicator color={NAVY} />
      ) : value ? (
        <Image source={{ uri: resolveAssetUrl(value) }} style={styles.preview} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="image-outline" size={26} color={MUTED} />
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
      {!!value && !uploading && (
        <Pressable style={styles.removeBtn} onPress={() => onChange(null)} hitSlop={8}>
          <Ionicons name="close-circle" size={20} color="#C0392B" />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: 96,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D9D6CC',
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    gap: 6,
    padding: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    textAlign: 'center',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
});
