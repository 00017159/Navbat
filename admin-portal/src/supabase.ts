import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://fuckrhsrqgseidbxymjj.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1Y2tyaHNycWdzZWlkYnh5bWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NDk0MTcsImV4cCI6MjA5MTAyNTQxN30.LdjR3W2oDJ6UgWsKKwELHt8rVZyxiKCInrmdnupbTTc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
