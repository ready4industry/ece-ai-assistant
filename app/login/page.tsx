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
      <div className="flex h-screen items-center justify-center bg-[#f8faf7]">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8faf7] via-[#f2f4f1] to-[#cde8de] p-4 md:p-8 font-sans text-on-surface">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-[0px_4px_20px_rgba(0,83,68,0.08)] border border-primary/15 relative overflow-hidden">
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />

        <div className="flex flex-col items-center text-center space-y-6 pt-2">
          {/* Logo Section */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-on-primary shadow-md border border-primary/20">
              <span className="text-3xl font-bold">⚡</span>
            </div>
            <h1 className="text-2xl font-bold text-primary tracking-tight mt-2">ECE Lab Pro AI</h1>
          </div>

          {/* Text Content */}
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-on-surface">Welcome to your Engineering Intelligence Hub</h2>
            <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
              Sign in with your university account to continue securely.
            </p>
          </div>

          {/* Sign In Action */}
          <div className="w-full pt-2">
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-[#41FDA8] hover:bg-[#20e990] text-[#003a2f] font-semibold py-3.5 px-6 rounded-xl transition-all border border-primary/10 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </div>

          {/* Divider */}
          <div className="w-full flex items-center py-1">
            <div className="flex-grow border-t border-outline-variant/50"></div>
            <span className="flex-shrink-0 px-3 text-[11px] font-semibold text-outline uppercase tracking-wider">SECURE LOGIN</span>
            <div className="flex-grow border-t border-outline-variant/50"></div>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 w-full text-xs font-medium text-secondary">
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <span className="text-outline-variant">•</span>
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <span className="text-outline-variant">•</span>
            <a href="#" className="hover:text-primary transition-colors">Institutional Access</a>
          </div>
        </div>
      </div>
    </div>
  );
}

