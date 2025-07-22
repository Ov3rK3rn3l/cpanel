import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uoeuxfitxeaahppzoptk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZXV4Zml0eGVhYWhwcHpvcHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MTU2MDUsImV4cCI6MjA2MzE5MTYwNX0.HvGhSSVgtolZ6U9V-hek9bSR50PEclLJk6opNBq7494';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);