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

export default function ForgotPasswordScreen() {
  const t = useTheme();
  const [email, setEmail] = React.useState('');

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
            onPress={() => {}}
            style={({ pressed }) => [
              {
                marginTop: 20,
                borderRadius: 12,
                minHeight: 58,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: t.colors.brand.forest,
                opacity: pressed ? 0.93 : 1,
              },
            ]}>
            <Text style={{ color: '#F8F7F3', fontWeight: '700', fontSize: 18 }}>
              Send reset link <FontAwesome name="long-arrow-right" size={16} />
            </Text>
          </Pressable>

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

