import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';

type IconName = React.ComponentProps<typeof FontAwesome>['name'];

const iconByRoute: Record<string, IconName> = {
  assets: 'th-large',
  audits: 'check-square-o',
  settings: 'cog',
};

const labelByRoute: Record<string, string> = {
  assets: 'Assets',
  audits: 'Your Reports',
  settings: 'Settings',
};

export function BottomNavBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
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
          {state.routes
            .filter((route) => route.name !== 'index')
            .map((route) => {
            const idx = state.routes.findIndex((r) => r.key === route.key);
            const focused = state.index === idx;
            const icon = iconByRoute[route.name] ?? 'circle';
            const label = labelByRoute[route.name] ?? route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name as never);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    minHeight: 62,
                    borderRadius: 18,
                    paddingVertical: t.spacing.sm,
                    paddingHorizontal: t.spacing.md,
                    backgroundColor: focused
                      ? activePill
                      : pressed
                        ? pressedPill
                        : 'transparent',
                    borderWidth: focused ? 1 : 1,
                    borderColor: focused ? 'rgba(0,74,38,0.22)' : 'transparent',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: t.spacing.sm,
                  },
                ]}>
                <FontAwesome
                  name={icon}
                  size={20}
                  color={focused ? activeText : inactiveText}
                />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: focused ? '800' : '700',
                    color: focused ? activeText : inactiveText,
                  }}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

