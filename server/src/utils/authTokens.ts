import jwt from 'jsonwebtoken';

const jwtSecret = () => process.env.JWT_SECRET || 'amorely';

export type GoogleSignupPendingPayload = {
  purpose: 'google_signup';
  googleId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
};

export const signAccessToken = (userId: string): string =>
  jwt.sign({ userId }, jwtSecret(), { expiresIn: '7d' });

export const signGoogleSignupPendingToken = (payload: Omit<GoogleSignupPendingPayload, 'purpose'>): string =>
  jwt.sign({ purpose: 'google_signup', ...payload }, jwtSecret(), { expiresIn: '30m' });

export const verifyGoogleSignupPendingToken = (token: string): GoogleSignupPendingPayload => {
  const decoded = jwt.verify(token, jwtSecret()) as GoogleSignupPendingPayload;
  if (decoded.purpose !== 'google_signup' || !decoded.googleId || !decoded.email) {
    throw new Error('Invalid pending token');
  }
  return decoded;
};
