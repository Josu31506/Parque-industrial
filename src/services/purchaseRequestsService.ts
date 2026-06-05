import type {
  ApiOrder,
  ApiPurchaseRequest,
  ApiPurchaseRequestGroup,
  ApiPurchaseRequestItem,
  MarketplaceItem,
  PaymentOption,
  PurchaseRequest,
  PurchaseRequestGroup,
} from '../types';
import { getRequest, patchRequest, postRequest } from './api';
import { mapApiOrderToOrder } from './ordersService';

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return undefined;
  return new Date(value).toLocaleDateString('es-PE');
};

const numberValue = (value: number | string | undefined) => Number(value ?? 0);

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

export async function createPurchaseRequest() {
  const response = await postRequest<ApiPurchaseRequest>('/purchase-requests');
  return mapApiPurchaseRequestToPurchaseRequest(response);
}

export async function getMyPurchaseRequests() {
  const response = await getRequest<ApiPurchaseRequest[]>('/purchase-requests/my');
  return response.map(mapApiPurchaseRequestToPurchaseRequest);
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
  return patchRequest(`/purchase-requests/groups/${groupId}/confirm`, { readyDate, observation });
}

export function rejectPurchaseRequestGroup(groupId: string, observation?: string) {
  return patchRequest(`/purchase-requests/groups/${groupId}/reject`, { observation });
}
