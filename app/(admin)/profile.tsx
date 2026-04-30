import { Redirect } from 'expo-router';

export default function LegacyAdminProfileRedirect() {
  return <Redirect href={'/admin/profile' as any} />;
}

