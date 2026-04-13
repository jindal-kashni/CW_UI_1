import React from 'react';
import { Tabs } from 'expo-router';
import { AdminBottomNavBar } from '@/src/layout';

export default function AdminTabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AdminBottomNavBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
        }}
      />
      <Tabs.Screen
        name="assets"
        options={{
          title: 'Assets',
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          href: null,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
        }}
      />
    </Tabs>
  );
}

