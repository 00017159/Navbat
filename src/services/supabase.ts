import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://fuckrhsrqgseidbxymjj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1Y2tyaHNycWdzZWlkYnh5bWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NDk0MTcsImV4cCI6MjA5MTAyNTQxN30.LdjR3W2oDJ6UgWsKKwELHt8rVZyxiKCInrmdnupbTTc';

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
