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
        <div className="w-7 h-7 bg-[#41FDA8] rounded-md flex items-center justify-center text-[#003a2f] shadow-sm">
          <span className="text-xs font-bold">⚡</span>
        </div>
        <span className="text-on-primary font-bold text-sm tracking-tight">{title}</span>
      </div>

      {user ? (
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
      ) : (
        <button
          onClick={() => router.push('/login')}
          className="bg-[#41FDA8] hover:bg-[#20e990] text-[#003a2f] text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
        >
          Sign In
        </button>
      )}
    </header>
  );
}
