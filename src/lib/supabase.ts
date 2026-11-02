import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'stratcrest_supabase_url_v1';
const STORAGE_KEY_KEY = 'stratcrest_supabase_anon_key_v1';

export interface SupabaseConfigState {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'custom' | 'none';
}

export const getSupabaseConfig = (): SupabaseConfigState => {
  // Check localStorage first
  let customUrl = '';
  let customKey = '';
  if (typeof localStorage !== 'undefined') {
    customUrl = localStorage.getItem(STORAGE_URL_KEY) || '';
    customKey = localStorage.getItem(STORAGE_KEY_KEY) || '';
  }

  if (customUrl && customKey && isValidSupabaseUrl(customUrl) && customKey.length > 20) {
    return {
      url: cleanSupabaseUrl(customUrl),
      anonKey: customKey,
      isConfigured: true,
      source: 'custom',
    };
  }

  // Fallback to import.meta.env
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (envUrl && envKey && isValidSupabaseUrl(envUrl) && envKey.length > 20 && !envUrl.includes('your-project')) {
    return {
      url: cleanSupabaseUrl(envUrl),
      anonKey: envKey,
      isConfigured: true,
      source: 'env',
    };
  }

  return {
    url: customUrl || envUrl || '',
    anonKey: customKey || envKey || '',
    isConfigured: false,
    source: 'none',
  };
};

export const cleanSupabaseUrl = (url: string): string => {
  let clean = url.trim();
  clean = clean.replace(/\/rest\/v1\/?$/, '');
  clean = clean.replace(/\/+$/, '');
  return clean;
};

export const isValidSupabaseUrl = (url: string): boolean => {
  try {
    const clean = cleanSupabaseUrl(url);
    const parsed = new URL(clean);
    return parsed.protocol === 'https:' && parsed.hostname.length > 5;
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseConfig().isConfigured;
};

// Singleton Supabase Client
let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  const config = getSupabaseConfig();
  if (!clientInstance) {
    clientInstance = createClient(
      config.url || 'https://placeholder.supabase.co',
      config.anonKey || 'placeholder-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
  }
  return clientInstance;
};

export const supabase: SupabaseClient = getSupabaseClient();

export const saveSupabaseConfig = (url: string, anonKey: string): void => {
  const cleanUrl = cleanSupabaseUrl(url);
  const cleanKey = anonKey.trim();
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_URL_KEY, cleanUrl);
    localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
  }
  // Reset client instance so subsequent calls use new credentials
  clientInstance = createClient(cleanUrl, cleanKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
};

export const clearSupabaseConfig = (): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_KEY_KEY);
  }
  const config = getSupabaseConfig();
  clientInstance = createClient(
    config.url || 'https://placeholder.supabase.co',
    config.anonKey || 'placeholder-key'
  );
};

export const testSupabaseConnection = async (
  testUrl?: string,
  testKey?: string
): Promise<{ success: boolean; message: string; latencyMs: number; details?: any }> => {
  const start = Date.now();
  try {
    const rawUrl = testUrl || getSupabaseConfig().url;
    const key = (testKey || getSupabaseConfig().anonKey || '').trim();
    const url = cleanSupabaseUrl(rawUrl);

    if (!url || !key) {
      return {
        success: false,
        message: 'Supabase URL or Anon Public Key is missing.',
        latencyMs: 0,
      };
    }

    if (!isValidSupabaseUrl(url)) {
      return {
        success: false,
        message: 'Invalid Supabase URL format. Must start with https:// and be a valid hostname.',
        latencyMs: 0,
      };
    }

    const testClient = createClient(url, key, {
      auth: { persistSession: false },
    });

    // Check basic Supabase API connection (attempt query on subscription_plans or organisations or auth health)
    const { data, error } = await testClient
      .from('subscription_plans')
      .select('id, name')
      .limit(1);

    const latencyMs = Date.now() - start;

    if (error) {
      // If table doesn't exist yet, but authentication reached Supabase (code 42P01: undefined_table)
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Connected to Supabase! (Multi-tenant tables have not been created yet; run migration SQL in SQL Editor).',
          latencyMs,
          details: { code: error.code, hint: 'Run the migration file in Supabase SQL Editor.' },
        };
      }
      return {
        success: false,
        message: `Supabase returned error (${error.code || 'UNKNOWN'}): ${error.message}`,
        latencyMs,
        details: error,
      };
    }

    return {
      success: true,
      message: `Successfully connected to Supabase! Found ${data?.length ?? 0} plan record(s).`,
      latencyMs,
      details: data,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return {
      success: false,
      message: err?.message || 'Network error attempting to reach Supabase project.',
      latencyMs,
    };
  }
};
