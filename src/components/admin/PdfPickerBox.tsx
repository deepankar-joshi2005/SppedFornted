import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { MUTED, NAVY } from '../../theme/colors';

export type PdfUploadResult = { url: string; fileName: string; fileSize: number };

type Props = {
  label: string;
  fileUrl: string | null;
  fileName?: string | null;
  fileSize?: number;
  onUpload: (file: {
    uri: string;
    name: string;
    mimeType?: string | null;
  }) => Promise<PdfUploadResult>;
  onChange: (result: PdfUploadResult | null) => void;
};

const formatSize = (bytes?: number): string => {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

export default function PdfPickerBox({ label, fileUrl, fileName, fileSize, onUpload, onChange }: Props) {
  const [uploading, setUploading] = useState(false);

  const pick = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets?.[0]) return;

    const asset = picked.assets[0];
    setUploading(true);
    try {
      const result = await onUpload({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/pdf',
      });
      onChange(result);
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Pressable style={styles.box} onPress={pick} disabled={uploading}>
      {uploading ? (
        <View style={styles.placeholder}>
          <ActivityIndicator color={NAVY} />
          <Text style={styles.label}>Uploading...</Text>
        </View>
      ) : fileUrl ? (
        <View style={styles.filled}>
          <Ionicons name="document-text" size={28} color={NAVY} />
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {fileName || 'PDF uploaded'}
            </Text>
            {!!fileSize && <Text style={styles.fileSize}>{formatSize(fileSize)}</Text>}
          </View>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="cloud-upload-outline" size={26} color={MUTED} />
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
      {!!fileUrl && !uploading && (
        <Pressable style={styles.removeBtn} onPress={() => onChange(null)} hitSlop={8}>
          <Ionicons name="close-circle" size={20} color="#C0392B" />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: 80,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D9D6CC',
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  placeholder: {
    alignItems: 'center',
    gap: 6,
  },
  filled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  fileInfo: {
    flexShrink: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    textAlign: 'center',
  },
  fileName: {
    fontSize: 13,
    fontWeight: '700',
    color: NAVY,
  },
  fileSize: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
});
