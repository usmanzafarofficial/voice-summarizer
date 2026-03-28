export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  profilePicture?: string; // URL or base64 data
  createdAt: string;
}

export type PublicUser = Pick<User, "id" | "name" | "email" | "profilePicture" | "createdAt">;

export function toPublicUser(user: User): PublicUser {
  const { id, name, email, profilePicture, createdAt } = user;
  return { id, name, email, profilePicture, createdAt };
}
