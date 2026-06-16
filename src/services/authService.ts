import type { ApiUser, User } from '../types';
import { AUTH_USER_KEY, clearAuthStorage, getRequest, postRequest, setAccessToken } from './api';

type LoginResponse = {
  accessToken: string;
  user: ApiUser;
};

export function mapApiUserToUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    role: apiUser.role,
    phone: apiUser.phone ?? undefined,
    district: apiUser.district ?? undefined,
    isActive: apiUser.isActive,
    createdAt: apiUser.createdAt,
  };
}

export function persistUser(user: User) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): User | null {
  const storedUser = localStorage.getItem(AUTH_USER_KEY);
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    clearAuthStorage();
    return null;
  }
}

export async function login(email: string, password: string) {
  const response = await postRequest<LoginResponse>('/auth/login', { email, password }, { skipAuth: true });
  setAccessToken(response.accessToken);
  const user = mapApiUserToUser(response.user);
  persistUser(user);
  return user;
}

export type RegisterClientInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  district?: string;
};

export async function registerClient(data: RegisterClientInput) {
  const response = await postRequest<LoginResponse>('/auth/register-client', data, { skipAuth: true });
  setAccessToken(response.accessToken);
  const user = mapApiUserToUser(response.user);
  persistUser(user);
  return user;
}

export async function getMe() {
  const user = await getRequest<ApiUser>('/auth/me');
  const mappedUser = mapApiUserToUser(user);
  persistUser(mappedUser);
  return mappedUser;
}

export function logout() {
  clearAuthStorage();
}
