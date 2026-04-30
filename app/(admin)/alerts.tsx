import { Redirect } from 'expo-router';

export default function LegacyAdminAlertsRedirect() {
  return <Redirect href={'/admin/alerts' as any} />;
}

