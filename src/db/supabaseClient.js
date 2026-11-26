import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

if (!env.supabase.url || !env.supabase.serviceRoleKey) {
  console.warn(
    'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set — database calls will fail.'
  );
}

export const supabase = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
  auth: { persistSession: false },
});

export const TRANSCRIPTIONS_TABLE = 'transcriptions';
