import Image from 'next/image';
import Link from 'next/link';
import NavItems from '@/components/nav-items';
import UserDropdown from '@/components/user-dropdown';

export default function Header() {
  return (
    <header className='sticky top-0 header'>
      <div className='container header-wrapper'>
        <Link href='/'>
          <Image
            src='/assets/icons/logo.svg'
            width={140}
            height={32}
            alt='logo'
            className='h-8 w-auto cursor-pointer'
          />
        </Link>
        <nav className='hidden sm:block'>
          <NavItems />
        </nav>
        <UserDropdown />
      </div>
    </header>
  );
}
