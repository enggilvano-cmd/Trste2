import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AppShellClient } from '@/components/app-shell-client';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect('/auth');
  return <AppShellClient />;
}
