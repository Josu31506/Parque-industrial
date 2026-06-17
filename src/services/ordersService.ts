import type {
  ApiOrder,
  ApiOrderStatus,
  ApiOrderItem,
  ApiSale,
  MarketplaceItem,
  Order,
  OrderProducerGroup,
  OrderStatus,
  PaginatedResponse,
  PaymentOption,
} from '../types';
import { getRequest, patchRequest, postRequest } from './api';

type ApiTrackingResponse = ApiOrder & { groups?: ApiSale[] };
type ApiOrdersResponse = ApiOrder[] | {
  items: ApiOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
};

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return undefined;
  return new Date(value).toLocaleDateString('es-PE');
};

const numberValue = (value: number | string | null | undefined) => Number(value ?? 0);

const mapOrderStatus = (status: ApiOrderStatus): OrderStatus => {
  if (status === 'DELIVERED' || status === 'CLOSED') return 'Entregado';
  if (status === 'VERIFIED') return 'Verificado' as OrderStatus;
  if (status === 'DISPATCHED') return 'En camino';
  if (status === 'READY_FOR_DISPATCH' || status === 'IN_PREPARATION') return 'En preparación';
  if (status === 'ORDER_CONFIRMED' || status === 'PAYMENT_COMPLETED') return 'Pedido confirmado';
  return 'En preparación';
};

const mapOrderItem = (item: ApiOrderItem): MarketplaceItem => {
  const unitPrice = numberValue(item.unitPrice);

  return {
    productId: item.productId ?? undefined,
    quoteId: item.quoteId ?? undefined,
    titleSnapshot: item.titleSnapshot ?? undefined,
    quantity: item.quantity,
    title: item.product?.title ?? item.titleSnapshot ?? item.quote?.title ?? 'Producto cotizado',
    price: `S/. ${unitPrice.toLocaleString('es-PE')}`,
    numericPrice: unitPrice,
    producerId: item.producerId,
    producerName: item.producer?.businessName ?? item.product?.producer?.businessName ?? 'Productor no asignado',
  };
};

const mapSaleGroup = (sale: ApiSale): OrderProducerGroup => ({
  producerId: sale.producerId,
  producerName: sale.producerName ?? sale.producer?.businessName ?? 'Productor no asignado',
  items: (sale.items ?? []).map((item) => ({
    productId: item.productId ?? undefined,
    quoteId: item.quoteId ?? undefined,
    titleSnapshot: item.titleSnapshot ?? undefined,
    quantity: item.quantity,
    title: item.product?.title ?? item.titleSnapshot ?? item.quote?.title ?? 'Producto cotizado',
    price: `S/. ${numberValue(item.unitPrice).toLocaleString('es-PE')}`,
    numericPrice: numberValue(item.unitPrice),
    producerId: sale.producerId,
    producerName: sale.producerName ?? sale.producer?.businessName ?? 'Productor no asignado',
  })),
  status: sale.status,
  readyDate: formatDate(sale.readyDate),
  observation: sale.observation ?? undefined,
});

export const mapApiOrderToOrder = (order: ApiOrder | ApiTrackingResponse): Order => {
  const marketplaceItems = (order.items ?? []).map(mapOrderItem);
  const sales = 'groups' in order && order.groups ? order.groups : order.sales ?? [];

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    apiStatus: order.status,
    date: formatDate(order.createdAt) ?? '',
    items: marketplaceItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    marketplaceItems,
    producerGroups: sales.map(mapSaleGroup),
    total: numberValue(order.total),
    status: mapOrderStatus(order.status),
    estimatedDeliveryDate: formatDate(order.estimatedDeliveryDate),
    dispatchedAt: order.dispatchedAt ?? undefined,
    deliveredAt: order.deliveredAt ?? undefined,
    verifiedAt: order.verifiedAt ?? undefined,
    autoVerifiedAt: order.autoVerifiedAt ?? undefined,
    claimDeadlineAt: order.claimDeadlineAt ?? undefined,
    completedAt: order.completedAt ?? undefined,
    fundsReleasedAt: order.fundsReleasedAt ?? undefined,
    paymentOption: order.paymentOption ?? undefined,
    paidAmount: order.paidAmount === null ? undefined : numberValue(order.paidAmount),
    remainingAmount: order.remainingAmount === null ? undefined : numberValue(order.remainingAmount),
    paymentStatus: order.paymentStatus ?? undefined,
    fundsStatus: order.fundsStatus ?? undefined,
  };
};

const normalizeOrdersResponse = (response: ApiOrdersResponse): PaginatedResponse<Order> => {
  const items = Array.isArray(response) ? response : response.items;
  const page = Array.isArray(response) ? 1 : response.page;
  const limit = Array.isArray(response) ? items.length : response.limit;
  const total = Array.isArray(response) ? items.length : response.total;

  return {
    items: items.map(mapApiOrderToOrder),
    total,
    page,
    limit,
    totalPages: Array.isArray(response) ? 1 : response.totalPages ?? Math.max(1, Math.ceil(total / limit)),
  };
};

export async function getMyOrders(options: { limit?: number; page?: number } = {}) {
  if (import.meta.env.DEV) console.debug('[api] GET /orders/my');
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 5),
  });
  const response = await getRequest<ApiOrdersResponse>(`/orders/my?${params.toString()}`);
  return normalizeOrdersResponse(response);
}

export async function getOrderById(id: string) {
  const response = await getRequest<ApiOrder>(`/orders/${id}`);
  return mapApiOrderToOrder(response);
}

export async function getOrderTracking(id: string) {
  if (import.meta.env.DEV) console.debug(`[api] GET /orders/${id}/tracking`);
  const response = await getRequest<ApiTrackingResponse>(`/orders/${id}/tracking`);
  return mapApiOrderToOrder(response);
}

export async function checkoutCart(paymentOption: PaymentOption = 'FULL_PAYMENT') {
  if (import.meta.env.DEV) console.debug('[api] POST /orders/checkout');
  const response = await postRequest<ApiOrder, { paymentOption: PaymentOption }>('/orders/checkout', {
    paymentOption,
  });
  return mapApiOrderToOrder(response);
}

export async function markOrderDelivered(id: string) {
  const response = await patchRequest<ApiOrder>(`/orders/${id}/mark-delivered`);
  return mapApiOrderToOrder(response);
}

export async function verifyOrder(id: string) {
  const response = await patchRequest<ApiOrder>(`/orders/${id}/verify`);
  return mapApiOrderToOrder(response);
}

export async function closeOrder(id: string) {
  const response = await patchRequest<ApiOrder>(`/orders/${id}/close`);
  return mapApiOrderToOrder(response);
}
