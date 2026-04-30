import { Stack } from 'expo-router';
import { RequireWorkspace } from '@/src/navigation/RequireWorkspace';

export default function AdminStackLayout() {
  return (
    <RequireWorkspace role="admin">
      <Stack screenOptions={{ headerShown: false }} />
    </RequireWorkspace>
  );
}
