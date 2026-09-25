import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser } from '../services/auth.service';

// Must track the backend JWT lifetime ("5d" in auth.controller.ts) — a stored
// session past this point is worthless since the token itself has expired.
const TOKEN_TTL_MS = 5 * 24 * 60 * 60 * 1000;

const KEYS = {
  token: 'speed_auth_token',
  user: 'speed_auth_user',
  expiresAt: 'speed_auth_expires_at',
};

export interface StoredAuth {
  token: string;
  user: AuthUser;
}

export async function saveAuth(token: string, user: AuthUser): Promise<void> {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  await AsyncStorage.multiSet([
    [KEYS.token, token],
    [KEYS.user, JSON.stringify(user)],
    [KEYS.expiresAt, String(expiresAt)],
  ]);
}

export async function loadAuth(): Promise<StoredAuth | null> {
  try {
    const entries = await AsyncStorage.multiGet([KEYS.token, KEYS.user, KEYS.expiresAt]);
    const values = Object.fromEntries(entries);
    const token = values[KEYS.token];
    const userJson = values[KEYS.user];
    const expiresAtStr = values[KEYS.expiresAt];
    if (!token || !userJson || !expiresAtStr) return null;

    const expiresAt = Number(expiresAtStr);
    if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
      await clearAuth();
      return null;
    }

    return { token, user: JSON.parse(userJson) as AuthUser };
  } catch {
    return null;
  }
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.token, KEYS.user, KEYS.expiresAt]);
}
