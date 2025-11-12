import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) redirect('/');

  return (
    <main className='auth-layout'>
      <section className='auth-left-section scrollbar-hide-default'>
        <Link href='/' className='auth-logo'>
          <Image
            src='/assets/icons/logo.svg'
            alt='Signalist logo'
            width={140}
            height={32}
            className='h-8 w-auto'
          />
        </Link>
        <div className='pb-6 lg:pb-8 flex-1'>{children}</div>
      </section>

      <section className='auth-right-section'>
        <div className='z-10 relative lg:mt-4 lg:mb-16'>
          <blockquote className='auth-blockquote'>
            Signalist has completely transformed how I track and analyze market
            trends. The intuitive interface and real-time alerts have helped me
            make more informed investment decisions. It&apos;s become an
            indispensable tool in my daily trading routine.
          </blockquote>
          <div className='flex items-center justify-between'>
            <div>
              <cite className='auth-testimonial-author'>— Alex P.</cite>
              <p className='max-md:text-xs text-gray-500'>
                Professional Trader
              </p>
            </div>
            <div className='flex items-center gap-0.5'>
              {[...Array(5)].map((_, index) => (
                <Image
                  key={index}
                  src='/assets/icons/star.svg'
                  alt='Star'
                  width={16}
                  height={16}
                  className='size-4'
                />
              ))}
            </div>
          </div>
        </div>
        <div className='flex-1 relative'>
          <Image
            src='/assets/images/dashboard.png'
            alt='Dashboard Preview'
            width={1440}
            height={1150}
            className='auth-dashboard-preview absolute top-0'
            priority
          />
        </div>
      </section>
    </main>
  );
}
