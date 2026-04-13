import React from 'react';
import { Tabs } from 'expo-router';
import { BottomNavBar } from '@/src/layout';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNavBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          href: null,
        }}
      />
      <Tabs.Screen
        name="audits"
        options={{
          title: 'Condition Reports',
        }}
      />
      <Tabs.Screen
        name="assets"
        options={{
          title: 'Assets',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}
