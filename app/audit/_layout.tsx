import { Stack } from 'expo-router';
import { RequireWorkspace } from '@/src/navigation/RequireWorkspace';

export default function AuditStackLayout() {
  return (
    <RequireWorkspace role="auditor">
      <Stack screenOptions={{ headerShown: false }} />
    </RequireWorkspace>
  );
}
