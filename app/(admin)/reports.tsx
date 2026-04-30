import { Redirect } from 'expo-router';

export default function LegacyAdminReportsRedirect() {
  return <Redirect href={'/admin/reports' as any} />;
}

