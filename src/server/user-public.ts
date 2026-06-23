import type { User } from '@prisma/client';

export type PublicUser = Omit<User, 'passwordHash'> & {
  hasPassword: boolean;
  usesGoogle: boolean;
};

export function toPublicUser(user: User): PublicUser {
  const { passwordHash, ...rest } = user;
  return {
    ...rest,
    hasPassword: Boolean(passwordHash),
    usesGoogle: Boolean(user.googleId),
  };
}
