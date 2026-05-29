import type { ApiUser, User } from '../types';
import { clearAccessToken, getRequest, postRequest, setAccessToken } from './api';

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
  };
}

export async function login(email: string, password: string) {
  const response = await postRequest<LoginResponse>('/auth/login', { email, password }, { skipAuth: true });
  setAccessToken(response.accessToken);
  return mapApiUserToUser(response.user);
}

export async function getMe() {
  const user = await getRequest<ApiUser>('/auth/me');
  return mapApiUserToUser(user);
}

export function logout() {
  clearAccessToken();
}
