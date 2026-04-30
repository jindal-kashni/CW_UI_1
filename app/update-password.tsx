import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Button, FormField, SectionCard } from '@/src/components';
import { AppBottomNav, ScreenContainer, TopBar } from '@/src/layout';
import { useTheme } from '@/src/theme';
import { supabase } from '@/utils/supabase';
import { useWorkspace } from '@/src/state/WorkspaceProvider';
import { pickFromLibrary, uploadPhoto } from '@/src/services/photos';

function UpdatePasswordContent() {
  const t = useTheme();
  const { role, user } = useWorkspace();
  const { first } = useLocalSearchParams<{ first?: string }>();
  const isFirstSignIn = first === '1';
  const userLabel = role === 'admin' ? 'Admin' : 'Auditor';
  const roleLabel = role === 'admin' ? 'Admin' : 'Auditor';
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [profilePictureUrl, setProfilePictureUrl] = React.useState('');
  const [profilePhotoLocalUri, setProfilePhotoLocalUri] = React.useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const [dateOfBirth, setDateOfBirth] = React.useState('');
  const [showIosDobPicker, setShowIosDobPicker] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const livePasswordInput = newPassword || confirmPassword;
  const mismatch = Boolean(confirmPassword) && newPassword !== confirmPassword;
  const passwordHasMinLength = livePasswordInput.length >= 8;
  const passwordHasUppercase = /[A-Z]/.test(livePasswordInput);
  const passwordHasLowercase = /[a-z]/.test(livePasswordInput);
  const passwordHasNumber = /\d/.test(livePasswordInput);
  const passwordHasSymbol = /[^A-Za-z0-9]/.test(livePasswordInput);
  const passwordIsValid =
    passwordHasMinLength &&
    passwordHasUppercase &&
    passwordHasLowercase &&
    passwordHasNumber &&
    passwordHasSymbol;
  const dobLooksValid = /^\d{2}\/\d{2}\/\d{4}$/.test(dateOfBirth.trim());

  const onSavePassword = async () => {
    setError(null);
    setMessage(null);
    if (isFirstSignIn) {
      if (!firstName.trim() || !lastName.trim() || !dateOfBirth.trim() || !newPassword.trim() || !confirmPassword.trim()) {
        setError('Please complete all required fields.');
        return;
      }
      if (!dobLooksValid) {
        setError('Date of birth must be in DD/MM/YYYY format.');
        return;
      }
    } else if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('Please complete all fields.');
      return;
    }
    if (mismatch) {
      setError('New passwords do not match.');
      return;
    }
    if (!passwordIsValid) {
      setError('Password does not meet requirements.');
      return;
    }

    setSaving(true);
    const userResult = await supabase.auth.getUser();
    const user = userResult.data.user ?? null;
    if (!user) {
      setSaving(false);
      setError('Could not verify active session.');
      return;
    }

    if (!isFirstSignIn) {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email ?? '',
        password: currentPassword,
      });
      if (verifyError) {
        setSaving(false);
        setError('Current password is incorrect.');
        return;
      }
    }

    let finalProfilePictureUrl = profilePictureUrl.trim() || user.user_metadata?.profile_picture_url || '';
    if (isFirstSignIn && profilePhotoLocalUri) {
      setUploadingPhoto(true);
      const upload = await uploadPhoto(
        {
          uri: profilePhotoLocalUri,
          fileName: `profile-${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
        },
        `profile/${user.id}`
      );
      setUploadingPhoto(false);
      if (!upload.ok) {
        setSaving(false);
        setError(`Profile image upload failed: ${upload.error}`);
        return;
      }
      finalProfilePictureUrl = upload.data.publicUrl ?? upload.data.path;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
      data: {
        must_reset_password: false,
        first_name: firstName.trim() || user.user_metadata?.first_name || '',
        last_name: lastName.trim() || user.user_metadata?.last_name || '',
        date_of_birth: dateOfBirth.trim() || user.user_metadata?.date_of_birth || '',
        profile_picture_url: finalProfilePictureUrl,
      },
    });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    if (isFirstSignIn) {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const now = new Date().toISOString();
      const dbRole = role === 'admin' ? 'Admin' : 'Auditor';
      const { error: profileError } = await supabase.from('user_profile').upsert(
        [
          {
            user_id: user.id,
            name: fullName,
            email: user.email ?? '',
            role: dbRole,
            updated_at: now,
          },
        ],
        { onConflict: 'user_id' }
      );
      if (profileError) {
        setError(`Profile saved, but name sync failed: ${profileError.message}`);
        return;
      }
    }
    setMessage('Password updated successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    if (isFirstSignIn) {
      if (role === 'admin') {
        router.replace('/admin' as any);
      } else {
        router.replace('/audit/history' as any);
      }
    }
  };

  const onPickProfilePhoto = async () => {
    setError(null);
    const picked = await pickFromLibrary();
    if (!picked) return;
    setProfilePhotoLocalUri(picked.uri);
  };

  const dobDateValue = React.useMemo(() => {
    if (!dobLooksValid) return new Date(2000, 0, 1);
    const [day, month, year] = dateOfBirth.split('/');
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? new Date(2000, 0, 1) : parsed;
  }, [dateOfBirth, dobLooksValid]);

  return (
    <ScreenContainer>
      <TopBar
        title={isFirstSignIn ? 'Complete Your Profile' : 'Update Password'}
        userName={userLabel}
        onPressBack={isFirstSignIn ? undefined : () => router.back()}
        hideActions={isFirstSignIn}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xl,
          gap: t.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}>
        <SectionCard
          title={isFirstSignIn ? 'Welcome to the Currumbin Wildlife Sanctuary Asset Management System' : 'Password'}
          subtitle={
            isFirstSignIn
              ? 'Please complete your details below to finish setting up your account.'
              : 'Update your account password securely.'
          }>
          <View style={{ gap: t.spacing.lg }}>
            {isFirstSignIn ? (
              <>
                <FormField label="Email" value={user?.email ?? ''} onChangeText={() => {}} editable={false} />
                <FormField label="Role" value={roleLabel} onChangeText={() => {}} editable={false} />
                <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <FormField label="First name *" value={firstName} onChangeText={setFirstName} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormField label="Last name *" value={lastName} onChangeText={setLastName} />
                  </View>
                </View>
                <FormField
                  label="Date of birth (DD/MM/YYYY) *"
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  editable={Platform.OS !== 'ios'}
                  hasError={Boolean(dateOfBirth) && !dobLooksValid}
                />
                {Platform.OS === 'ios' ? (
                  <View style={{ marginTop: -t.spacing.sm }}>
                    <Pressable
                      onPress={() => setShowIosDobPicker((prev) => !prev)}
                      style={t.button.secondary}>
                      <Text style={{ color: t.colors.brand.forest, fontWeight: '700' }}>
                        {showIosDobPicker ? 'Hide date selector' : 'Select date of birth'}
                      </Text>
                    </Pressable>
                    {showIosDobPicker ? (
                      <DateTimePicker
                        value={dobDateValue}
                        mode="date"
                        display="spinner"
                        maximumDate={new Date()}
                        onChange={(_event, selectedDate) => {
                          if (!selectedDate) return;
                          const y = selectedDate.getFullYear();
                          const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                          const d = String(selectedDate.getDate()).padStart(2, '0');
                          setDateOfBirth(`${d}/${m}/${y}`);
                        }}
                      />
                    ) : null}
                  </View>
                ) : null}
                <View style={{ gap: 8 }}>
                  <Text style={[t.text.caption, { color: t.colors.text.muted }]}>Profile picture (optional)</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: t.colors.border.subtle,
                        backgroundColor: t.colors.card.surfaceAlt,
                        overflow: 'hidden',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      {profilePhotoLocalUri ? (
                        <Image source={{ uri: profilePhotoLocalUri }} style={{ width: 64, height: 64 }} />
                      ) : (
                        <FontAwesome name="user-circle-o" size={38} color={t.colors.text.muted} />
                      )}
                    </View>
                    <Pressable onPress={onPickProfilePhoto} style={t.button.secondary}>
                      <Text style={{ color: t.colors.brand.forest, fontWeight: '700', fontSize: 12 }}>
                        {profilePhotoLocalUri ? 'Change photo' : 'Select photo'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </>
            ) : (
              <FormField label="Current password" value={currentPassword} onChangeText={setCurrentPassword} />
            )}
            <FormField
              label={isFirstSignIn ? 'Password *' : 'New password *'}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <FormField
              label={isFirstSignIn ? 'Repeat password *' : 'Repeat new password *'}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              hasError={mismatch}
            />
            <View
              style={{
                borderWidth: 1,
                borderColor: 'rgba(0,74,38,0.20)',
                backgroundColor: 'rgba(0,74,38,0.06)',
                borderRadius: 10,
                paddingHorizontal: t.spacing.md,
                paddingVertical: t.spacing.sm,
                gap: 4,
              }}>
              <Text style={[t.text.caption, { fontWeight: '700' }]}>Password requirements</Text>
              <Text style={[t.text.caption, { color: passwordHasMinLength ? '#2F6B4B' : '#B63E34' }]}>
                {passwordHasMinLength ? '✓' : '✕'} At least 8 characters
              </Text>
              <Text style={[t.text.caption, { color: passwordHasUppercase ? '#2F6B4B' : '#B63E34' }]}>
                {passwordHasUppercase ? '✓' : '✕'} At least 1 uppercase letter
              </Text>
              <Text style={[t.text.caption, { color: passwordHasLowercase ? '#2F6B4B' : '#B63E34' }]}>
                {passwordHasLowercase ? '✓' : '✕'} At least 1 lowercase letter
              </Text>
              <Text style={[t.text.caption, { color: passwordHasNumber ? '#2F6B4B' : '#B63E34' }]}>
                {passwordHasNumber ? '✓' : '✕'} At least 1 number
              </Text>
              <Text style={[t.text.caption, { color: passwordHasSymbol ? '#2F6B4B' : '#B63E34' }]}>
                {passwordHasSymbol ? '✓' : '✕'} At least 1 symbol
              </Text>
            </View>
            {error ? <Text style={[t.text.caption, { color: '#B63E34' }]}>{error}</Text> : null}
            {message ? <Text style={[t.text.caption, { color: '#2F5B45' }]}>{message}</Text> : null}
            <Button
              label={
                saving
                  ? 'Saving...'
                  : uploadingPhoto
                    ? 'Uploading photo...'
                    : isFirstSignIn
                      ? 'Complete setup'
                      : 'Save password'
              }
              onPress={saving || uploadingPhoto ? undefined : onSavePassword}
            />
            {uploadingPhoto ? <ActivityIndicator size="small" color={t.colors.brand.forest} /> : null}
          </View>
        </SectionCard>
      </ScrollView>
      {!isFirstSignIn ? <AppBottomNav /> : null}
    </ScreenContainer>
  );
}

export default function UpdatePasswordScreen() {
  return <UpdatePasswordContent />;
}

