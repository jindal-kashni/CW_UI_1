import { Redirect } from 'expo-router';

export default function LegacyAuditorSettingsRedirect() {
  return <Redirect href={'/audit/settings' as any} />;
}

