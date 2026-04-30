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
import { supabase } from '@/utils/supabase';

export default function ForgotPasswordScreen() {
  const t = useTheme();
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const onResetPassword = async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setError('Please enter your email.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalized);
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage('Reset email sent. Check your inbox for password reset steps.');
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
            Reset your password
          </Text>
          <Text style={[t.text.caption, { marginTop: 10, fontSize: 16, lineHeight: 22 }]}>
            Enter the email address associated with your account and we&apos;ll send you a link to
            reset your password.
          </Text>

          <View style={{ marginTop: 30, gap: 14 }}>
            <Text style={[t.text.caption, { color: t.colors.text.secondary, fontWeight: '700', fontSize: 15 }]}>Email address</Text>
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
              <FontAwesome name="envelope-o" size={16} color={t.colors.text.muted} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@company.com.au"
                placeholderTextColor={t.colors.text.muted}
                style={{ flex: 1, fontSize: 16, color: t.colors.text.primary }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <Pressable
            onPress={onResetPassword}
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
              {loading ? 'Sending...' : 'Send reset link'} {!loading ? <FontAwesome name="long-arrow-right" size={16} /> : null}
            </Text>
          </Pressable>
          {message ? (
            <Text style={[t.text.caption, { marginTop: 12, color: '#2F5B45' }]}>{message}</Text>
          ) : null}
          {error ? <Text style={[t.text.caption, { marginTop: 12, color: '#B63E34' }]}>{error}</Text> : null}

          <Pressable onPress={() => router.replace('/')} style={{ marginTop: 22, alignSelf: 'center' }}>
            <Text style={[t.text.caption, { color: t.colors.brand.forest, fontWeight: '700', fontSize: 14 }]}>
              <FontAwesome name="long-arrow-left" size={13} /> Back to Sign In
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

