import { Redirect } from 'expo-router';

export default function LegacyAdminAssetsRedirect() {
  return <Redirect href={'/admin/assets' as any} />;
}
