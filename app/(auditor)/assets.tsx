import { Redirect } from 'expo-router';

export default function LegacyAuditorAssetsRedirect() {
  return <Redirect href={'/audit/assets' as any} />;
}

