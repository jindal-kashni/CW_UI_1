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
  const inAdminTabs = segments[0] === '(admin)';
  const showBack = !inAdminTabs && pathname.startsWith('/admin/');
  const handleAdminBack = React.useCallback(() => {
    if (pathname === '/admin/update-password') {
      router.replace('/(admin)/profile' as any);
      return;
    }
    if (pathname.startsWith('/admin/locations')) {
      router.replace('/admin/locations' as any);
      return;
    }
    if (pathname.startsWith('/admin/reports')) {
      router.replace('/(admin)/reports' as any);
      return;
    }
    if (pathname.startsWith('/admin/assets')) {
      router.replace('/(admin)/assets' as any);
      return;
    }
    router.replace('/(admin)/more' as any);
  }, [pathname]);

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
        onPressUser={() => router.push('/(admin)/profile' as any)}
        onPressBack={showBack ? handleAdminBack : undefined}
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

