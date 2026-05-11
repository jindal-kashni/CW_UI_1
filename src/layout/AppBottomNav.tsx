import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { usePathname, router } from 'expo-router';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { getAuditorSettingsDirty, setAuditorSettingsDirty } from '@/src/state/auditorSettingsDraftGuard';

/** Auditor workspace tab bar only (separate from admin app). */
const AUDITOR_BASE = '/audit' as const;
const items = [
  { key: 'audits', label: 'Your Reports', icon: 'check-square-o', href: `${AUDITOR_BASE}/history` },
  { key: 'assets', label: 'Assets', icon: 'th-large', href: `${AUDITOR_BASE}/assets` },
  { key: 'settings', label: 'Settings', icon: 'cog', href: `${AUDITOR_BASE}/settings` },
] as const;

function isActive(pathname: string, key: 'audits' | 'assets' | 'settings') {
  if (key === 'assets') {
    return pathname === '/audit/assets' || pathname.startsWith('/audit/form/') || pathname.startsWith('/asset/');
  }
  if (key === 'audits') {
    return (
      pathname === '/audit/history' ||
      pathname.startsWith('/audit/history/') ||
      pathname.startsWith('/audit/report/') ||
      pathname.startsWith('/audit/review/') ||
      pathname.startsWith('/audit/structured-form') ||
      pathname === '/audits'
    );
  }
  if (key === 'settings') return pathname === '/audit/settings' || pathname.startsWith('/audit/settings');
  return false;
}

export function AppBottomNav() {
  const t = useTheme();
  const pathname = usePathname();
  const [showUnsavedModal, setShowUnsavedModal] = React.useState(false);
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);
  const navItems = items;
  const headerGreen = '#004A26';
  const navBg = '#F7F6F2';
  const activePill = 'rgba(0,74,38,0.10)';
  const pressedPill = 'rgba(0,74,38,0.08)';
  const activeText = headerGreen;
  const inactiveText = 'rgba(0,74,38,0.72)';

  return (
    <SafeAreaView
      edges={['bottom']}
      style={{
        backgroundColor: navBg,
      }}>
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,74,38,0.16)',
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.sm,
          paddingBottom: t.spacing.md,
        }}>
        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          {navItems.map((item) => {
            const active = isActive(pathname, item.key);
            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  const leavingAuditSettings = pathname === '/audit/settings' && item.href !== '/audit/settings';
                  if (leavingAuditSettings && getAuditorSettingsDirty()) {
                    setPendingHref(item.href);
                    setShowUnsavedModal(true);
                    return;
                  }
                  router.replace(item.href as any);
                }}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    minHeight: 62,
                    borderRadius: 18,
                    paddingVertical: t.spacing.sm,
                    paddingHorizontal: t.spacing.md,
                    backgroundColor: active
                      ? activePill
                      : pressed
                        ? pressedPill
                        : 'transparent',
                    borderWidth: 1,
                    borderColor: active ? 'rgba(0,74,38,0.22)' : 'transparent',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: t.spacing.sm,
                  },
                ]}>
                <FontAwesome
                  name={item.icon as any}
                  size={20}
                  color={active ? activeText : inactiveText}
                />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: active ? '800' : '700',
                    color: active ? activeText : inactiveText,
                  }}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Modal
        visible={showUnsavedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnsavedModal(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.25)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: t.spacing.xl,
          }}>
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: '#FFFFFF',
              borderRadius: t.radius.lg,
              borderWidth: 1,
              borderColor: 'rgba(30,31,28,0.10)',
              padding: t.spacing.lg,
              gap: t.spacing.md,
            }}>
            <Text style={[t.text.title, { fontSize: 18, lineHeight: 24 }]}>Unsaved changes</Text>
            <Text style={t.text.bodyMuted}>You need to save your changes before leaving this page.</Text>
            <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
              <Pressable
                onPress={() => {
                  setShowUnsavedModal(false);
                  setPendingHref(null);
                }}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    minHeight: 42,
                    borderRadius: t.radius.lg,
                    borderWidth: 1,
                    borderColor: 'rgba(0,74,38,0.22)',
                    backgroundColor: pressed ? 'rgba(0,74,38,0.08)' : '#F4F1EA',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}>
                <Text style={{ color: '#2F5B45', fontWeight: '700' }}>Keep editing</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const href = pendingHref;
                  setAuditorSettingsDirty(false);
                  setShowUnsavedModal(false);
                  setPendingHref(null);
                  if (href) router.replace(href as any);
                }}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    minHeight: 42,
                    borderRadius: t.radius.lg,
                    borderWidth: 1,
                    borderColor: '#B63E34',
                    backgroundColor: pressed ? '#9F342C' : '#B63E34',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Discard changes</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
