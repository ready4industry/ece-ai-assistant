'use client';

import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase-client';
import { useRouter }    from 'next/navigation';
import { useAuth }      from '@/components/AuthProvider';
import { useEffect }    from 'react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/assistant');
  }, [user, loading, router]);

  async function handleGoogleSignIn() {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(firebaseAuth, provider);
      router.replace('/assistant');
    } catch (err) {
      console.error('Sign-in failed', err);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-4">
        <div className="bg-surface rounded-2xl p-8 shadow-sm border border-outline-variant">
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center">
              <span className="text-on-primary text-2xl font-bold">E</span>
            </div>
            <h1 className="text-xl font-semibold text-on-surface mt-2">ECE Lab Pro</h1>
            <p className="text-sm text-on-surface-variant text-center">
              AI-powered learning assistant for ECE students
            </p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-outline-variant rounded-xl hover:bg-surface-container transition-colors text-sm font-medium text-on-surface"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          <p className="text-xs text-on-surface-variant text-center mt-6">
            Use your college Google account for full access
          </p>
        </div>
      </div>
    </div>
  );
}
