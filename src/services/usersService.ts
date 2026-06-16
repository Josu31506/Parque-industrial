import type { ApiRole, ApiUser, PaginatedResponse, User } from '../types';
import { deleteRequest, getRequest, patchRequest } from './api';
import { mapApiUserToUser } from './authService';

type ApiUsersResponse = ApiUser[] | {
  items: ApiUser[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
};

const normalizeUsersResponse = (response: ApiUsersResponse): PaginatedResponse<User> => {
  const items = Array.isArray(response) ? response : response.items;
  const page = Array.isArray(response) ? 1 : response.page;
  const limit = Array.isArray(response) ? items.length : response.limit;
  const total = Array.isArray(response) ? items.length : response.total;

  return {
    items: items.map(mapApiUserToUser),
    total,
    page,
    limit,
    totalPages: Array.isArray(response) ? 1 : response.totalPages ?? Math.max(1, Math.ceil(total / limit)),
  };
};

export async function getUsers(options: { limit?: number; page?: number; role?: ApiRole } = {}): Promise<PaginatedResponse<User>> {
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 10),
  });
  if (options.role) params.set('role', options.role);
  const users = await getRequest<ApiUsersResponse>(`/users?${params.toString()}`);
  return normalizeUsersResponse(users);
}

export async function activateUser(id: string): Promise<User> {
  const user = await patchRequest<ApiUser>(`/users/${id}/activate`);
  return mapApiUserToUser(user);
}

export async function deactivateUser(id: string): Promise<User> {
  const user = await patchRequest<ApiUser>(`/users/${id}/deactivate`);
  return mapApiUserToUser(user);
}

export async function removeUser(id: string): Promise<User> {
  const user = await deleteRequest<ApiUser>(`/users/${id}`);
  return mapApiUserToUser(user);
}
