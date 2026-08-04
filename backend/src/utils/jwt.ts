import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-jwt-secret-change-in-production'
);

export interface AuthTokenPayload {
  sub: string;
  email: string;
  fullName: string;
}

export async function signAuthToken(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email, fullName: payload.fullName })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const sub = payload.sub;
    const email = payload.email;
    const fullName = payload.fullName;
    if (typeof sub !== 'string' || typeof email !== 'string' || typeof fullName !== 'string') {
      return null;
    }
    return { sub, email, fullName };
  } catch {
    return null;
  }
}
