import { Ionicons } from '@expo/vector-icons';

export type SocialPlatformKey =
  | 'instagram'
  | 'facebook'
  | 'whatsapp'
  | 'youtube'
  | 'telegram'
  | 'twitter'
  | 'linkedin'
  | 'discord'
  | 'pinterest'
  | 'snapchat'
  | 'website'
  | 'other';

export type SocialPlatformMeta = {
  key: SocialPlatformKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

// Preset platforms shown as quick-pick chips in the admin panel and used to
// render the matching brand icon/color on the student side.
export const SOCIAL_PLATFORMS: SocialPlatformMeta[] = [
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
  { key: 'facebook', label: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
  { key: 'youtube', label: 'YouTube', icon: 'logo-youtube', color: '#FF0000' },
  { key: 'telegram', label: 'Telegram', icon: 'paper-plane', color: '#26A5E4' },
  { key: 'twitter', label: 'Twitter / X', icon: 'logo-twitter', color: '#1DA1F2' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2' },
  { key: 'discord', label: 'Discord', icon: 'logo-discord', color: '#5865F2' },
  { key: 'pinterest', label: 'Pinterest', icon: 'logo-pinterest', color: '#E60023' },
  { key: 'snapchat', label: 'Snapchat', icon: 'logo-snapchat', color: '#FFFC00' },
  { key: 'website', label: 'Website', icon: 'globe-outline', color: '#16315C' },
  { key: 'other', label: 'Other', icon: 'share-social-outline', color: '#CC9A3D' },
];

const PLATFORM_MAP: Record<string, SocialPlatformMeta> = SOCIAL_PLATFORMS.reduce(
  (acc, p) => ({ ...acc, [p.key]: p }),
  {} as Record<string, SocialPlatformMeta>
);

export const getSocialPlatformMeta = (platform: string): SocialPlatformMeta =>
  PLATFORM_MAP[platform] ?? PLATFORM_MAP.other;
