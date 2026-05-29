import type { ApiClaim, Claim } from '../types';
import { getRequest, patchRequest, postRequest } from './api';

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('es-PE');
};

const mapApiClaimToClaim = (claim: ApiClaim): Claim => ({
  id: claim.id,
  orderId: claim.orderId,
  customerId: claim.customerId,
  reason: claim.reason,
  description: claim.description,
  status: claim.status,
  createdAt: formatDate(claim.createdAt),
});

export async function createClaim(orderId: string, reason: string, description: string) {
  const response = await postRequest<ApiClaim>('/claims', { orderId, reason, description });
  return mapApiClaimToClaim(response);
}

export async function getMyClaims() {
  const response = await getRequest<ApiClaim[]>('/claims/my');
  return response.map(mapApiClaimToClaim);
}

export async function getAllClaims() {
  const response = await getRequest<ApiClaim[]>('/claims');
  return response.map(mapApiClaimToClaim);
}

export async function getClaimById(id: string) {
  const response = await getRequest<ApiClaim>(`/claims/${id}`);
  return mapApiClaimToClaim(response);
}

export async function markClaimInReview(id: string) {
  const response = await patchRequest<ApiClaim>(`/claims/${id}/in-review`);
  return mapApiClaimToClaim(response);
}

export async function resolveClaim(id: string) {
  const response = await patchRequest<ApiClaim>(`/claims/${id}/resolve`);
  return mapApiClaimToClaim(response);
}

export async function rejectClaim(id: string) {
  const response = await patchRequest<ApiClaim>(`/claims/${id}/reject`);
  return mapApiClaimToClaim(response);
}
