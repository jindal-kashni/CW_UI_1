import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';

type IconName = React.ComponentProps<typeof FontAwesome>['name'];

const iconByRoute: Record<string, IconName> = {
  index: 'tachometer',
  reports: 'file-text-o',
  assets: 'cubes',
  settings: 'cog',
  alerts: 'bell-o',
  more: 'sliders',
};

const labelByRoute: Record<string, string> = {
  index: 'Dashboard',
  reports: 'Reports',
  assets: 'Assets',
  settings: 'Settings',
  alerts: 'Alerts',
  more: 'Admin',
};

export function AdminBottomNavBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const headerGreen = '#004A26';
  const navBg = '#F7F6F2';

  return (
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: navBg }}>
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
            .filter((route) => !['alerts', 'audits', 'profile'].includes(route.name))
            .map((route) => {
            const idx = state.routes.findIndex((item) => item.key === route.key);
            const focused = state.index === idx;
            const icon = iconByRoute[route.name] ?? 'circle';
            const label = labelByRoute[route.name] ?? route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name as never);
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
                      ? 'rgba(0,74,38,0.12)'
                      : pressed
                        ? 'rgba(0,74,38,0.07)'
                        : 'transparent',
                    borderWidth: 1,
                    borderColor: focused ? 'rgba(0,74,38,0.30)' : 'transparent',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: t.spacing.sm,
                  },
                ]}>
                <FontAwesome name={icon} size={20} color={focused ? headerGreen : 'rgba(0,74,38,0.72)'} />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: focused ? '800' : '700',
                    color: focused ? headerGreen : 'rgba(0,74,38,0.72)',
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

