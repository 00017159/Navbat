import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fuckrhsrqgseidbxymjj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1Y2tyaHNycWdzZWlkYnh5bWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NDk0MTcsImV4cCI6MjA5MTAyNTQxN30.LdjR3W2oDJ6UgWsKKwELHt8rVZyxiKCInrmdnupbTTc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('profiles').select('email, role').eq('email', 'sadullayevshohjahon990@gmail.com');
  console.log('User Role is strictly:', data[0]?.role);
  if (error) console.error(error);
}
check();
