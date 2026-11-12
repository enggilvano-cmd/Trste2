import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AuthPageClient } from './auth-client';

export const dynamic = 'force-dynamic';

export default async function AuthPage() {
  const session = await auth();
  if (session) redirect('/');
  return <AuthPageClient />;
}
