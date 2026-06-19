'use client';

import { signOut } from 'firebase/auth';
import { firebaseAuth }  from '@/lib/firebase-client';
import { useAuth }       from './AuthProvider';
import { useRouter }     from 'next/navigation';
import Image             from 'next/image';

interface TopbarProps {
  title?: string;
}

export function Topbar({ title = 'ECE Lab Pro' }: TopbarProps) {
  const { user } = useAuth();
  const router   = useRouter();

  async function handleSignOut() {
    await signOut(firebaseAuth);
    router.replace('/login');
  }

  return (
    <header className="h-14 bg-primary flex items-center justify-between px-4 shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 bg-secondary-container rounded flex items-center justify-center">
          <span className="text-primary text-xs font-bold">E</span>
        </div>
        <span className="text-on-primary font-semibold text-sm">{title}</span>
      </div>

      {user && (
        <div className="flex items-center gap-3">
          {user.photoURL && (
            <Image
              src={user.photoURL}
              alt={user.displayName ?? 'User'}
              width={28}
              height={28}
              className="rounded-full"
            />
          )}
          <span className="text-on-primary/80 text-xs hidden sm:block">
            {user.displayName ?? user.email}
          </span>
          <button
            onClick={handleSignOut}
            className="text-on-primary/60 hover:text-on-primary text-xs transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
