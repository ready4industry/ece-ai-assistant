// Uses service_role key — bypasses RLS for all server-side operations.
// Uses SUPABASE_POOLER_URL to avoid connection exhaustion on free tier (GapFix Gap 20).
import 'server-only';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_POOLER_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
