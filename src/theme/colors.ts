export const NAVY = '#16315C';
export const NAVY_DARK = '#0C1E3B';
export const GOLD = '#CC9A3D';
export const GOLD_LIGHT = '#E9C468';
export const GOLD_SOFT = 'rgba(204,154,61,0.55)';
export const GOLD_TINT = '#FBEFD8';
export const CREAM = '#FDFBF6';
export const ERROR = '#C0392B';
export const MUTED = '#5B6577';

export const NAVY_GRADIENT: [string, string] = [NAVY, NAVY_DARK];
export const GOLD_GRADIENT: [string, string] = [GOLD_LIGHT, GOLD];

export const CARD_SHADOW = {
  shadowColor: '#16315C',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
} as const;

export const SOFT_SHADOW = {
  shadowColor: '#16315C',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 2,
} as const;
