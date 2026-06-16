import type {
  ApiOrder,
  ApiPurchaseRequest,
  ApiPurchaseRequestGroup,
  ApiPurchaseRequestItem,
  MarketplaceItem,
  PaginatedResponse,
  PaymentOption,
  PurchaseRequest,
  PurchaseRequestGroup,
  PurchaseRequestStatus,
} from '../types';
import { getRequest, patchRequest, postRequest } from './api';
import { mapApiOrderToOrder } from './ordersService';

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return undefined;
  return new Date(value).toLocaleDateString('es-PE');
};

const numberValue = (value: number | string | undefined) => Number(value ?? 0);

type ApiPurchaseRequestsResponse = ApiPurchaseRequest[] | {
  items: ApiPurchaseRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
};

const mapRequestItem = (item: ApiPurchaseRequestItem): MarketplaceItem => {
  const unitPrice = numberValue(item.unitPrice);

  return {
    productId: item.productId,
    quantity: item.quantity,
    title: item.product?.title ?? 'Producto no disponible',
    price: `S/. ${unitPrice.toLocaleString('es-PE')}`,
    numericPrice: unitPrice,
    producerId: item.producerId,
    producerName: item.producer?.businessName ?? item.product?.producer?.businessName ?? 'Productor no asignado',
  };
};

const mapRequestGroup = (
  group: ApiPurchaseRequestGroup,
  items: MarketplaceItem[],
): PurchaseRequestGroup => ({
  id: group.id,
  producerId: group.producerId,
  producerName: group.producer?.businessName ?? 'Productor no asignado',
  items: items.filter((item) => item.producerId === group.producerId),
  status: group.status,
  readyDate: formatDate(group.readyDate),
  observation: group.observation ?? undefined,
});

export const mapApiPurchaseRequestToPurchaseRequest = (
  request: ApiPurchaseRequest,
): PurchaseRequest => {
  const items = (request.items ?? []).map(mapRequestItem);

  return {
    id: request.id,
    customerId: request.customerId,
    customerName: 'Cliente',
    items,
    groupsByProducer: (request.groups ?? []).map((group) => mapRequestGroup(group, items)),
    status: request.status,
    createdAt: formatDate(request.createdAt) ?? '',
    estimatedDeliveryDate: formatDate(request.estimatedDeliveryDate),
    deliveryDays: request.deliveryDays,
    total: numberValue(request.total),
  };
};

const normalizePurchaseRequestsResponse = (
  response: ApiPurchaseRequestsResponse,
): PaginatedResponse<PurchaseRequest> => {
  const items = Array.isArray(response) ? response : response.items;
  const page = Array.isArray(response) ? 1 : response.page;
  const limit = Array.isArray(response) ? items.length : response.limit;
  const total = Array.isArray(response) ? items.length : response.total;

  return {
    items: items.map(mapApiPurchaseRequestToPurchaseRequest),
    total,
    page,
    limit,
    totalPages: Array.isArray(response) ? 1 : response.totalPages ?? Math.max(1, Math.ceil(total / limit)),
  };
};

export async function createPurchaseRequest() {
  const response = await postRequest<ApiPurchaseRequest>('/purchase-requests');
  return mapApiPurchaseRequestToPurchaseRequest(response);
}

export async function getMyPurchaseRequests(options: { limit?: number; page?: number } = {}) {
  if (import.meta.env.DEV) console.debug('[api] GET /purchase-requests/my');
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 5),
  });
  const response = await getRequest<ApiPurchaseRequestsResponse>(`/purchase-requests/my?${params.toString()}`);
  return normalizePurchaseRequestsResponse(response);
}

type ApiSellerPurchaseRequest = {
  groupId: string;
  producerId?: string;
  productTitle: string;
  quantity: number;
  status: PurchaseRequestGroup['status'];
  deliveryDistrict?: string | null;
  requestedAt?: string | null;
  notes?: string | null;
  estimatedReadyDate?: string | null;
  sellerComment?: string | null;
};

type ApiSellerPurchaseRequestsResponse = ApiSellerPurchaseRequest[] | {
  items: ApiSellerPurchaseRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
};

const mapSellerPurchaseRequest = (item: ApiSellerPurchaseRequest): PurchaseRequest => {
  const marketplaceItem: MarketplaceItem = {
    productId: item.groupId,
    quantity: item.quantity,
    title: item.productTitle,
    price: 'S/. 0',
    numericPrice: 0,
    producerId: item.producerId ?? 'seller',
    producerName: 'Tu productora',
  };

  return {
    id: item.groupId,
    customerId: '',
    customerName: 'Cliente registrado',
    items: [marketplaceItem],
    groupsByProducer: [{
      id: item.groupId,
      producerId: item.producerId ?? 'seller',
      producerName: 'Tu productora',
      items: [marketplaceItem],
      status: item.status,
      readyDate: formatDate(item.estimatedReadyDate),
      observation: item.sellerComment ?? item.notes ?? undefined,
    }],
    status: item.status === 'CONFIRMED'
      ? 'READY_TO_PAY' as PurchaseRequestStatus
      : 'PENDING_PRODUCER_CONFIRMATION',
    createdAt: formatDate(item.requestedAt) ?? '',
    deliveryDays: 2,
    total: 0,
  };
};

export async function getSellerPurchaseRequests(options: { limit?: number; page?: number } = {}) {
  if (import.meta.env.DEV) console.debug('[api] GET /purchase-requests/seller');
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 5),
  });
  const response = await getRequest<ApiSellerPurchaseRequestsResponse>(`/purchase-requests/seller?${params.toString()}`);
  const items = Array.isArray(response) ? response : response.items;
  const page = Array.isArray(response) ? 1 : response.page;
  const limit = Array.isArray(response) ? items.length : response.limit;
  const total = Array.isArray(response) ? items.length : response.total;

  return {
    items: items.map(mapSellerPurchaseRequest),
    total,
    page,
    limit,
    totalPages: Array.isArray(response) ? 1 : response.totalPages ?? Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getPurchaseRequestById(id: string) {
  const response = await getRequest<ApiPurchaseRequest>(`/purchase-requests/${id}`);
  return mapApiPurchaseRequestToPurchaseRequest(response);
}

export async function cancelPurchaseRequest(id: string) {
  const response = await patchRequest<ApiPurchaseRequest>(`/purchase-requests/${id}/cancel`);
  return mapApiPurchaseRequestToPurchaseRequest(response);
}

export async function continueWithConfirmed(id: string) {
  const response = await patchRequest<ApiPurchaseRequest>(`/purchase-requests/${id}/continue-confirmed`);
  return mapApiPurchaseRequestToPurchaseRequest(response);
}

export async function payPurchaseRequest(id: string, paymentOption: PaymentOption) {
  const response = await postRequest<ApiOrder>(`/purchase-requests/${id}/pay`, { paymentOption });
  return mapApiOrderToOrder(response);
}

export function confirmPurchaseRequestGroup(groupId: string, readyDate: string, observation?: string) {
  return patchRequest(`/purchase-requests/groups/${groupId}/confirm`, {
    estimatedReadyDate: readyDate,
    sellerComment: observation,
  });
}

export function rejectPurchaseRequestGroup(groupId: string, observation?: string) {
  return patchRequest(`/purchase-requests/groups/${groupId}/reject`, { reason: observation });
}
