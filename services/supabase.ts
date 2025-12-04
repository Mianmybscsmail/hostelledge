import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iacdxoaoskonkmhfhqfs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhY2R4b2Fvc2tvbmttaGZocWZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzY3MTYsImV4cCI6MjA4MDQxMjcxNn0.Ufhbfi88iYPOxRr2X5p46i9hooe8krblijeLFJ9_xO8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);