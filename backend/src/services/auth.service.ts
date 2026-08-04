import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { signAuthToken } from '../utils/jwt.js';

const SALT_ROUNDS = 12;

export interface RegisterInput {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function registerUser(input: RegisterInput) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      fullName: input.fullName.trim(),
      email,
      phone: input.phone?.trim() || null,
      passwordHash,
    },
  });

  const token = await signAuthToken({
    sub: user.id,
    email: user.email,
    fullName: user.fullName,
  });

  return {
    token,
    user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone },
  };
}

export async function loginUser(input: LoginInput) {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const token = await signAuthToken({
    sub: user.id,
    email: user.email,
    fullName: user.fullName,
  });

  return {
    token,
    user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone },
  };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, email: true, phone: true },
  });
  return user;
}
