/* ==========================================================================
   SUPABASE CONFIGURATION & INITIALIZATION
   Replace SUPABASE_URL and SUPABASE_ANON_KEY with your Supabase Project details.
   ========================================================================== */

// 1. Enter your Supabase Project Credentials here:
const SUPABASE_URL = "https://iuwoiznrvkhszzplyrqm.supabase.co";       // e.g. https://xyzcompany.supabase.co
const SUPABASE_ANON_KEY = "sb_publishable_tbrCmUgCuXE2pIlwq5raLA_HwNq6JYz"; // e.g. eyJhbGciOiJIUzI1Ni...

// 2. Initialize Supabase Client
let supabaseClient = null;

if (
  typeof supabase !== 'undefined' &&
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("https://iuwoiznrvkhszzplyrqm.supabase.co")
) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("✅ Supabase client initialized successfully!");
  } catch (err) {
    console.error("❌ Failed to initialize Supabase client:", err);
  }
} else {
  console.log("ℹ️ Supabase credentials not configured yet. App is running with LocalStorage fallback mode.");
}
