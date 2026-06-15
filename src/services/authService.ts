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
    phone: apiUser.phone ?? undefined,
    district: apiUser.district ?? undefined,
    isActive: apiUser.isActive,
    createdAt: apiUser.createdAt,
  };
}

export async function login(email: string, password: string) {
  const response = await postRequest<LoginResponse>('/auth/login', { email, password }, { skipAuth: true });
  setAccessToken(response.accessToken);
  return mapApiUserToUser(response.user);
}

export type RegisterClientInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  district?: string;
};

export type RegisterSellerInput = RegisterClientInput & {
  producer: {
    businessName: string;
    type: string;
    location: string;
    description: string;
    phone?: string;
    address?: string;
  };
};

export async function registerClient(data: RegisterClientInput) {
  const response = await postRequest<LoginResponse>('/auth/register-client', data, { skipAuth: true });
  setAccessToken(response.accessToken);
  return mapApiUserToUser(response.user);
}

export async function registerSeller(data: RegisterSellerInput) {
  const response = await postRequest<LoginResponse>('/auth/register-seller', data, { skipAuth: true });
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
