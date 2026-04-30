import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

function requiredEnv(
  key:
    | 'EXPO_PUBLIC_SUPABASE_URL'
    | 'EXPO_PUBLIC_SUPABASE_KEY'
    | 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
) {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required env var: ${key}`)
  }
  return value
}

const supabaseUrl = requiredEnv('EXPO_PUBLIC_SUPABASE_URL')
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ??
  requiredEnv('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY')

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
})