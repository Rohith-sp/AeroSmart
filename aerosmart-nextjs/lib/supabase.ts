import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser-safe Supabase client.
 * Used for:
 *   - Realtime subscriptions (telemetry INSERT events)
 *   - REST queries (historical rows for analytics + XAI table)
 *
 * HARDWARE SWAP: When brain.py is live, useLiveTelemetry.ts will call
 * supabase.from('telemetry').select(...) instead of getMockTelemetry().
 */
export const supabase = createClient(supabaseUrl, supabaseKey);
