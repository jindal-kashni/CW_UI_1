import React from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { router, usePathname, useSegments } from 'expo-router';
import { useTheme } from '@/src/theme';
import { AdminAppBottomNav } from './AdminAppBottomNav';
import { ScreenContainer } from './ScreenContainer';
import { TopBar } from './TopBar';

export function AdminScreenScaffold({
  title,
  children,
  scroll = true,
  contentStyle,
}: {
  title: string;
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}) {
  const t = useTheme();
  const segments = useSegments();
  const pathname = usePathname();
  const inAdminTabs = segments[0] === '(admin-tabs)';
  const showBack = !inAdminTabs && pathname.startsWith('/admin/');

  const content = (
    <View
      style={[
        {
          flex: 1,
          paddingHorizontal: t.spacing.xl,
          paddingTop: t.spacing.lg,
          paddingBottom: t.spacing.xl,
        },
        contentStyle,
      ]}>
      {children}
    </View>
  );

  return (
    <ScreenContainer>
      <TopBar
        title={title}
        userName="Admin"
        onPressUser={() => router.push('/admin/profile' as any)}
        onPressBack={showBack ? () => router.back() : undefined}
      />
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: t.spacing.xxxl }}
          showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
      {!inAdminTabs ? <AdminAppBottomNav /> : null}
    </ScreenContainer>
  );
}

