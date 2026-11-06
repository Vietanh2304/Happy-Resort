import { createClient } from '@supabase/supabase-js';

// trim: khóa dán vào GitHub Secrets hay dính dấu xuống dòng → Realtime từ chối kết nối (REST thì vẫn chạy)
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim().replace(/\/+$/, '');
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const configured = Boolean(url && key);
export const supabase = createClient(url || 'http://localhost', key || 'missing-key');
