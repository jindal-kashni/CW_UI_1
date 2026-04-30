import { Redirect } from 'expo-router';

export default function LegacyAuditorSettingsRedirect() {
  return <Redirect href={'/profile' as any} />;
}

