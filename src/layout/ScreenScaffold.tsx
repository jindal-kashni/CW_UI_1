import React from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { currentUser } from '@/src/data';
import { useTheme } from '@/src/theme';
import { ScreenContainer } from './ScreenContainer';
import { TopBar } from './TopBar';

export function ScreenScaffold({
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
      <TopBar title={title} userName={currentUser.name} onPressUser={() => router.push('/profile')} />
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
    </ScreenContainer>
  );
}

