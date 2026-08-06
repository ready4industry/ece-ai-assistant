import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';

function getFirebaseAdminApp(): App {
  if (getApps().length) {
    return getApps()[0];
  }

  // 1. Try single JSON string (FIREBASE_SERVICE_ACCOUNT) if provided
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      return initializeApp({ credential: cert(sa) });
    } catch (e) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e);
    }
  }

  // 2. Fall back to individual env variables
  const projectId   = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey      = process.env.FIREBASE_ADMIN_PRIVATE_KEY || '';
  const privateKey  = rawKey ? rawKey.replace(/\\n/g, '\n') : undefined;

  return initializeApp({
    credential: cert({
      projectId:   projectId || '',
      clientEmail: clientEmail || '',
      privateKey:  privateKey,
    }),
  });
}

const adminApp = getFirebaseAdminApp();

export async function verifyToken(req: Request): Promise<DecodedIdToken> {
  const auth  = req.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) throw new Error('UNAUTHORIZED: missing token');
  return getAuth(adminApp).verifyIdToken(token);
}

