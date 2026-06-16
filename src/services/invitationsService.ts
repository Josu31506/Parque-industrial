import type { ApiInvitation, ApiRole, ApiUser, User } from '../types';
import { getRequest, patchRequest, postRequest, setAccessToken } from './api';
import { mapApiUserToUser, persistUser } from './authService';
import { mapApiProducerToProducer } from './producersService';

export type Invitation = {
  id: string;
  email: string;
  role: Extract<ApiRole, 'SELLER' | 'ADVISOR' | 'ADMIN'>;
  status: ApiInvitation['status'];
  expiresAt: string;
  createdAt: string;
  producer?: ReturnType<typeof mapApiProducerToProducer>;
};

export type InvitationProducerInput = {
  businessName: string;
  type: string;
  location: string;
  description: string;
};

export type CreateInvitationInput = {
  email: string;
  role: Invitation['role'];
};

export type AcceptInvitationInput = {
  token: string;
  name: string;
  phone?: string;
  password: string;
  producerData?: InvitationProducerInput;
};

type InvitationAuthResponse = {
  accessToken: string;
  user: ApiUser;
};

const formatDate = (value: string) => new Date(value).toLocaleDateString('es-PE');

export const mapApiInvitationToInvitation = (invitation: ApiInvitation): Invitation => ({
  id: invitation.id,
  email: invitation.email,
  role: invitation.role,
  status: invitation.status,
  expiresAt: formatDate(invitation.expiresAt),
  createdAt: formatDate(invitation.createdAt),
  producer: invitation.producer ? mapApiProducerToProducer(invitation.producer) : undefined,
});

export async function getInvitations() {
  const response = await getRequest<ApiInvitation[]>('/invitations');
  return response.map(mapApiInvitationToInvitation);
}

export async function createInvitation(data: CreateInvitationInput) {
  const response = await postRequest<ApiInvitation, CreateInvitationInput>('/invitations', data);
  return mapApiInvitationToInvitation(response);
}

export async function validateInvitation(token: string) {
  const response = await getRequest<ApiInvitation>(`/invitations/validate/${token}`, { skipAuth: true });
  return mapApiInvitationToInvitation(response);
}

export async function acceptInvitation(data: AcceptInvitationInput): Promise<User> {
  const response = await postRequest<InvitationAuthResponse, AcceptInvitationInput>(
    '/invitations/accept',
    data,
    { skipAuth: true },
  );
  setAccessToken(response.accessToken);
  const user = mapApiUserToUser(response.user);
  persistUser(user);
  return user;
}

export async function cancelInvitation(id: string) {
  const response = await patchRequest<ApiInvitation>(`/invitations/${id}/cancel`);
  return mapApiInvitationToInvitation(response);
}

export async function resendInvitation(id: string) {
  const response = await postRequest<ApiInvitation>(`/invitations/${id}/resend`);
  return mapApiInvitationToInvitation(response);
}
