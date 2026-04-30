import { Redirect } from 'expo-router';

export default function LegacyAuditorIndexRedirect() {
  return <Redirect href={'/audit/history' as any} />;
}
