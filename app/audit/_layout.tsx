import { Stack } from 'expo-router';
import { RequireWorkspace } from '@/src/navigation/RequireWorkspace';

export default function AuditStackLayout() {
  return (
    <RequireWorkspace role="auditor">
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 140,
          gestureEnabled: true,
        }}
      />
    </RequireWorkspace>
  );
}
