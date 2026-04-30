import { Redirect } from 'expo-router';

export default function LegacyAuditorAuditsRedirect() {
  return <Redirect href={'/audit/history' as any} />;
}

