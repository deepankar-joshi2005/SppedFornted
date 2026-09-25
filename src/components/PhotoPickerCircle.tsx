import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { resolveAssetUrl } from '../config/api';
import { uploadImage } from '../services/upload.service';
import { MUTED, NAVY } from '../theme/colors';

type Props = {
  token: string;
  value: string | null;
  onChange: (url: string | null) => void;
  size?: number;
};

export default function PhotoPickerCircle({ token, value, onChange, size = 84 }: Props) {
  const [uploading, setUploading] = useState(false);

  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to set a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const url = await uploadImage(token, {
        uri: asset.uri,
        name: asset.fileName ?? `profile-${Date.now()}.jpg`,
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
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
      onPress={pick}
      disabled={uploading}
    >
      {uploading ? (
        <ActivityIndicator color={NAVY} />
      ) : value ? (
        <Image source={{ uri: resolveAssetUrl(value) }} style={styles.image} />
      ) : (
        <Ionicons name="camera-outline" size={size * 0.36} color={MUTED} />
      )}
      <View style={styles.editBadge}>
        <Ionicons name="pencil" size={12} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: '#EEF1F7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: NAVY,
    alignSelf: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
