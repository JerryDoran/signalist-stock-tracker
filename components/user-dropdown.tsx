'use client';

import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';
import NavItems from '@/components/nav-items';
import { signOut } from '@/lib/actions/auth.actions';

export default function UserDropdown({ user }: { user: User }) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push('/sign-in');
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex items-center gap-3 text-gray-400 hover:text-yellow-500'
        >
          <Avatar className='size-8'>
            <AvatarImage src='https://github.com/shadcn.png' />
            <AvatarFallback className='bg-yellow-500 text-yellow-900 text-sm font-bold'>
              {user.name[0]}
            </AvatarFallback>
          </Avatar>
          <div className='hidden md:flex flex-col items-start'>
            <span className='text-base font-medium text-gray-400'>
              {user.name}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='text-gray-400'>
        <DropdownMenuLabel>
          <div className='flex relative items-center gap-3 py-2'>
            <Avatar className='size-10'>
              <AvatarImage src='https://github.com/shadcn.png' />
              <AvatarFallback className='bg-yellow-500 text-yellow-900 text-sm font-bold'>
                {user.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className='flex flex-col'>
              <span className='text-base font-medium text-gray-400'>
                {user.name}
              </span>
              <span className='text-sm text-gray-500'>{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className='bg-gray-600' />
        <DropdownMenuItem
          onClick={handleSignOut}
          className='text-gray-100 font-medium text-md focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer'
        >
          <LogOut className='mr-1 size-4 hidden sm:block' /> Sign out
        </DropdownMenuItem>
        <DropdownMenuSeparator className='sm:hidden bg-gray-600' />
        <nav className='sm:hidden'>
          <NavItems />
        </nav>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
