import { Redirect } from 'expo-router';

export default function LegacyAdminMoreRedirect() {
  return <Redirect href={'/admin/settings' as any} />;
}

