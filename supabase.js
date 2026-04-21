import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Replace these with the keys you saved in your Notepad!
const supabaseUrl = 'https://dobbtypvarmdflorbecf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYmJ0eXB2YXJtZGZsb3JiZWNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTI1OTUsImV4cCI6MjA5MjAyODU5NX0.SifZM8_cKswEJ71pbqn8a3paLODVW2QLs6SqvaOKloc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);