import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '@/src/theme';
import { useWorkspace } from '@/src/state/WorkspaceProvider';
import { supabase } from '@/utils/supabase';

export default function LoginScreen() {
  const t = useTheme();
  const { setRole, signOutMessage, clearSignOutMessage } = useWorkspace();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [remember, setRemember] = React.useState(true);
  const [roleError, setRoleError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const onSignIn = async () => {
    clearSignOutMessage();
    setRoleError('');

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setRoleError('Enter your email and password.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: trimmedPassword,
    });

    if (error) {
      setLoading(false);
      setRoleError(error.message);
      return;
    }

    const userEmail = data.user?.email?.toLowerCase() ?? '';

    // roles defined here
    if (userEmail.includes('admin')) {
      setRole('admin');
      setLoading(false);
      router.replace('/(admin)' as any);
      return;
    }

    setRole('auditor');
    setLoading(false);
    router.replace('/(auditor)/audits' as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ECEEEA', justifyContent: 'center' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ paddingHorizontal: 32 }}>
        <View style={{ alignSelf: 'center', width: '100%', maxWidth: 460 }}>
          <Text
            style={{
              fontSize: 52,
              lineHeight: 56,
              fontWeight: '800',
              color: t.colors.text.primary,
              letterSpacing: -0.8,
            }}>
            Welcome back
          </Text>

          <Text style={[t.text.caption, { marginTop: 10, fontSize: 16, lineHeight: 22 }]}>
            Sign in to manage sanctuary assets
          </Text>

          {signOutMessage ? (
            <View
              style={{
                marginTop: 16,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 12,
                backgroundColor: 'rgba(47,107,75,0.12)',
                borderWidth: 1,
                borderColor: 'rgba(47,107,75,0.35)',
              }}
              accessibilityRole="text"
              accessibilityLiveRegion="polite">
              <Text style={{ color: '#2F5B45', fontWeight: '700', fontSize: 15, lineHeight: 20 }}>
                {signOutMessage}
              </Text>
            </View>
          ) : null}

          <View style={{ marginTop: 30, gap: 14 }}>
            <Text
              style={[
                t.text.caption,
                { color: t.colors.text.secondary, fontWeight: '700', fontSize: 15 },
              ]}>
              Username or email
            </Text>

            <View
              style={{
                borderRadius: 14,
                backgroundColor: '#E1E5DE',
                borderWidth: 1,
                borderColor: 'rgba(30, 31, 28, 0.06)',
                paddingHorizontal: 14,
                minHeight: 56,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@currumbin.com.au"
                placeholderTextColor={t.colors.text.muted}
                style={{ flex: 1, fontSize: 16, color: t.colors.text.primary }}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
              <FontAwesome name="envelope-o" size={16} color={t.colors.text.muted} />
            </View>
          </View>

          <View style={{ marginTop: 14, gap: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text
                style={[
                  t.text.caption,
                  { color: t.colors.text.secondary, fontWeight: '700', fontSize: 15 },
                ]}>
                Password
              </Text>

              <Pressable onPress={() => router.push('/forgot-password' as any)}>
                <Text
                  style={[
                    t.text.caption,
                    { color: t.colors.brand.forest, fontWeight: '700', fontSize: 14 },
                  ]}>
                  Forgot password?
                </Text>
              </Pressable>
            </View>

            <View
              style={{
                borderRadius: 14,
                backgroundColor: '#E1E5DE',
                borderWidth: 1,
                borderColor: 'rgba(30, 31, 28, 0.06)',
                paddingHorizontal: 14,
                minHeight: 56,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={t.colors.text.muted}
                secureTextEntry
                style={{ flex: 1, fontSize: 16, color: t.colors.text.primary }}
                editable={!loading}
              />
              <FontAwesome name="eye" size={16} color={t.colors.text.muted} />
            </View>
          </View>

          <Pressable
            onPress={() => setRemember((v) => !v)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: 'rgba(30,31,28,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: remember ? 'rgba(31,59,44,0.12)' : 'transparent',
              }}>
              {remember ? <FontAwesome name="check" size={11} color={t.colors.brand.forest} /> : null}
            </View>
            <Text style={[t.text.caption, { fontSize: 14 }]}>Remember for device for 30 days</Text>
          </Pressable>

          <Pressable
            onPress={onSignIn}
            disabled={loading}
            style={({ pressed }) => [
              {
                marginTop: 20,
                borderRadius: 12,
                minHeight: 58,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: t.colors.brand.forest,
                opacity: loading || pressed ? 0.93 : 1,
              },
            ]}>
            <Text style={{ color: '#F8F7F3', fontWeight: '700', fontSize: 18 }}>
              {loading ? 'Signing In...' : 'Sign In '}
              {!loading ? <FontAwesome name="long-arrow-right" size={16} /> : null}
            </Text>
          </Pressable>

          {roleError ? (
            <Text style={[t.text.caption, { color: '#B63E34', marginTop: t.spacing.sm }]}>
              {roleError}
            </Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}