import { createClient } from '@supabase/supabase-js';

/**
 * מפתח ה-publishable ו-URL הם ציבוריים במתכוון (מוגנים ע"י Row Level Security
 * בצד השרת) — כך שקוד לקוח סטטי כמו כאן יכול לכלול אותם ישירות.
 */
const SUPABASE_URL = 'https://bqtajtacsulfcjzfbxmf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_tS-iTMLqs4ukhZgoxvd-Tw_iKDjc83O';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
