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
        // Set session cookie so middleware allows access to protected routes.
        // This is a UX gate only — actual auth verification is done per-route via verifyToken().
        document.cookie = 'firebase-session=1; path=/; SameSite=Strict';

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
        // Clear session cookie on sign-out so middleware redirects correctly
        document.cookie = 'firebase-session=; path=/; max-age=0; SameSite=Strict';

        if (pathname !== '/login') {
          router.replace('/login');
        }
      }
    });

    return () => unsub();
  }, [router, pathname]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
