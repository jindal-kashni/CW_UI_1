import { Redirect } from 'expo-router';

export default function LegacyAdminAuditsRedirect() {
  return <Redirect href={'/admin/reports/assign' as any} />;
}
