import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Simple in-memory storage that works in Expo Go without native modules
const memoryStorage = new Map<string, string>();

const ExpoStorage = {
  getItem: (key: string): string | null => {
    return memoryStorage.get(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    memoryStorage.set(key, value);
  },
  removeItem: (key: string): void => {
    memoryStorage.delete(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
