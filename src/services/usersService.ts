import type { ApiRole, ApiUser, User } from '../types';
import { getRequest, patchRequest, postRequest } from './api';
import { mapApiUserToUser } from './authService';

export type InternalUserInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: Extract<ApiRole, 'SELLER' | 'ADVISOR' | 'ADMIN'>;
  producer?: {
    businessName: string;
    type: string;
    location: string;
    description: string;
  };
};

export async function getUsers(): Promise<User[]> {
  const users = await getRequest<ApiUser[]>('/users');
  return users.map(mapApiUserToUser);
}

export async function createInternalUser(data: InternalUserInput): Promise<User> {
  const user = await postRequest<ApiUser, InternalUserInput>('/users/internal', data);
  return mapApiUserToUser(user);
}

export async function activateUser(id: string): Promise<User> {
  const user = await patchRequest<ApiUser>(`/users/${id}/activate`);
  return mapApiUserToUser(user);
}

export async function deactivateUser(id: string): Promise<User> {
  const user = await patchRequest<ApiUser>(`/users/${id}/deactivate`);
  return mapApiUserToUser(user);
}
