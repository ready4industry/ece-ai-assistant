'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { firebaseAuth }             from '@/lib/firebase-client';
import { useRouter, usePathname }   from 'next/navigation';

interface AuthContextValue {
  user:    User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        // Upsert user record on every login
        try {
          const token = await firebaseUser.getIdToken();
          await fetch('/api/users/upsert', {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body:    JSON.stringify({}),
          });
        } catch {
          // Non-critical — swallow
        }

        if (pathname === '/login') {
          router.replace('/assistant');
        }
      } else {
        if (pathname !== '/login') {
          router.replace('/login');
        }
      }
    });

    return () => unsub();
  }, [router, pathname]);

  if (loading || (!user && pathname !== '/login')) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8faf7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-primary font-sans">Connecting to ECE Lab Pro...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

