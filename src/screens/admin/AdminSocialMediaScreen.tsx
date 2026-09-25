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
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ToggleRow from '../../components/admin/ToggleRow';
import { AdminNav } from '../../navigation/adminTypes';
import {
  AdminSocialMedia,
  createAdminSocialMedia,
  deleteAdminSocialMedia,
  getAdminSocialMedia,
  updateAdminSocialMedia,
} from '../../services/admin/socialMedia.service';
import { MUTED, NAVY, SOFT_SHADOW } from '../../theme/colors';
import { getSocialPlatformMeta, SOCIAL_PLATFORMS } from '../../utils/socialPlatforms';

type Props = {
  token: string;
  nav: AdminNav;
};

export default function AdminSocialMediaScreen({ token, nav }: Props) {
  const [links, setLinks] = useState<AdminSocialMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLink, setEditingLink] = useState<AdminSocialMedia | null>(null);

  const [platform, setPlatform] = useState<string>(SOCIAL_PLATFORMS[0].key);
  const [label, setLabel] = useState(SOCIAL_PLATFORMS[0].label);
  const [link, setLink] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAdminSocialMedia(token);
      setLinks(data);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load social links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpenAdd = () => {
    setEditingLink(null);
    setPlatform(SOCIAL_PLATFORMS[0].key);
    setLabel(SOCIAL_PLATFORMS[0].label);
    setLink('');
    setIsActive(true);
    setModalVisible(true);
  };

  const handleOpenEdit = (item: AdminSocialMedia) => {
    setEditingLink(item);
    setPlatform(item.platform);
    setLabel(item.label);
    setLink(item.link);
    setIsActive(item.isActive);
    setModalVisible(true);
  };

  const handlePickPlatform = (key: string) => {
    setPlatform(key);
    // Auto-fill label with the preset name unless the admin is on "Other" (custom name expected)
    if (key !== 'other') {
      setLabel(getSocialPlatformMeta(key).label);
    } else if (label === getSocialPlatformMeta(platform).label) {
      setLabel('');
    }
  };

  const handleSave = async () => {
    if (!label.trim() || !link.trim()) {
      Alert.alert('Missing info', 'Please enter a name and a link before saving.');
      return;
    }
    setSaving(true);
    try {
      if (editingLink) {
        await updateAdminSocialMedia(token, editingLink.id, {
          platform,
          label: label.trim(),
          link: link.trim(),
          isActive,
        });
      } else {
        await createAdminSocialMedia(token, {
          platform,
          label: label.trim(),
          link: link.trim(),
          isActive,
        });
      }
      setModalVisible(false);
      load();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save social link');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Link', 'Are you sure you want to remove this social media link?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAdminSocialMedia(token, id);
            load();
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => nav.pop()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>Social Media Links</Text>
        <Pressable style={styles.addBtn} onPress={handleOpenAdd}>
          <Ionicons name="add" size={24} color="#FFF" />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={NAVY} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={links}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No social media links yet. Tap + to add one.</Text>
          }
          renderItem={({ item }) => {
            const meta = getSocialPlatformMeta(item.platform);
            return (
              <View style={styles.linkCard}>
                <View style={[styles.iconCircle, { backgroundColor: meta.color }]}>
                  <Ionicons name={meta.icon} size={20} color="#FFF" />
                </View>
                <View style={styles.linkInfo}>
                  <Text style={styles.linkLabel}>{item.label}</Text>
                  <Text style={styles.linkUrl} numberOfLines={1}>
                    {item.link}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    item.isActive ? styles.statusActive : styles.statusInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.isActive ? styles.statusTextActive : styles.statusTextInactive,
                    ]}
                  >
                    {item.isActive ? 'Live' : 'Hidden'}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  <Pressable onPress={() => handleOpenEdit(item)} style={styles.iconBtn}>
                    <Ionicons name="pencil-outline" size={19} color={NAVY} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={19} color="#DC2626" />
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editingLink ? 'Edit Social Link' : 'Add Social Media Link'}
            </Text>
            <ScrollView style={{ width: '100%' }}>
              <Text style={styles.inputLabel}>Platform</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {SOCIAL_PLATFORMS.map((p) => {
                  const selected = platform === p.key;
                  return (
                    <Pressable
                      key={p.key}
                      style={[
                        styles.chip,
                        selected && { backgroundColor: p.color, borderColor: p.color },
                      ]}
                      onPress={() => handlePickPlatform(p.key)}
                    >
                      <Ionicons
                        name={p.icon}
                        size={15}
                        color={selected ? '#FFFFFF' : p.color}
                      />
                      <Text style={[styles.chipText, selected && { color: '#FFFFFF' }]}>
                        {p.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Instagram"
                value={label}
                onChangeText={setLabel}
              />

              <Text style={styles.inputLabel}>Profile / Page Link</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                autoCapitalize="none"
                autoCorrect={false}
                value={link}
                onChangeText={setLink}
              />

              <View style={{ marginTop: 14 }}>
                <ToggleRow
                  label="Show on Student App"
                  description="Students will see this icon on the Social Media page"
                  value={isActive}
                  onChange={setIsActive}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={[styles.btn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.saveBtn]} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Link</Text>
                )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: NAVY },
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
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    ...SOFT_SHADOW,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkInfo: { flex: 1, marginRight: 8 },
  linkLabel: { fontSize: 13.5, fontWeight: '800', color: NAVY },
  linkUrl: { fontSize: 11, color: MUTED, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 6 },
  statusActive: { backgroundColor: '#E1F5EA' },
  statusInactive: { backgroundColor: '#F1F5F9' },
  statusText: { fontSize: 10, fontWeight: '800' },
  statusTextActive: { color: '#2E9E5B' },
  statusTextInactive: { color: MUTED },
  cardActions: { flexDirection: 'row' },
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
  inputLabel: { fontSize: 12, fontWeight: '700', color: NAVY, marginTop: 12, marginBottom: 6 },
  chipRow: { flexGrow: 0 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#F8FAFC',
  },
  chipText: { fontSize: 12, fontWeight: '700', color: NAVY },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 16,
    gap: 10,
  },
  btn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  cancelBtn: { backgroundColor: '#E2E8F0' },
  cancelBtnText: { color: NAVY, fontWeight: '700' },
  saveBtn: { backgroundColor: NAVY },
  saveBtnText: { color: '#FFF', fontWeight: '800' },
});
