import Header from '@/components/header';
import { auth } from '@/lib/better-auth/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect('/sign-in');

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };
  return (
    <main className='min-h-screen text-gray-400'>
      <Header user={user} />
      <div className='container py-10'>{children}</div>
    </main>
  );
}
