import type {
  ApiOrder,
  ApiOrderItem,
  ApiSale,
  MarketplaceItem,
  Order,
  OrderProducerGroup,
  OrderStatus,
} from '../types';
import { getRequest, patchRequest } from './api';

type ApiTrackingResponse = ApiOrder & { groups?: ApiSale[] };

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return undefined;
  return new Date(value).toLocaleDateString('es-PE');
};

const numberValue = (value: number | string | null | undefined) => Number(value ?? 0);

const mapOrderStatus = (status: string): OrderStatus => {
  if (status === 'DELIVERED' || status === 'CLOSED') return 'Entregado';
  if (status === 'DISPATCHED') return 'En camino';
  if (status === 'ORDER_CONFIRMED' || status === 'PAYMENT_COMPLETED') return 'Pedido confirmado';
  return 'En preparación';
};

const mapOrderItem = (item: ApiOrderItem): MarketplaceItem => {
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

const mapSaleGroup = (sale: ApiSale): OrderProducerGroup => ({
  producerId: sale.producerId,
  producerName: sale.producerName ?? sale.producer?.businessName ?? 'Productor no asignado',
  items: (sale.items ?? []).map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    title: item.product?.title ?? 'Producto no disponible',
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
    date: formatDate(order.createdAt) ?? '',
    items: marketplaceItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    marketplaceItems,
    producerGroups: sales.map(mapSaleGroup),
    total: numberValue(order.total),
    status: mapOrderStatus(order.status),
    estimatedDeliveryDate: formatDate(order.estimatedDeliveryDate),
    paymentOption: order.paymentOption ?? undefined,
    paidAmount: order.paidAmount === null ? undefined : numberValue(order.paidAmount),
    remainingAmount: order.remainingAmount === null ? undefined : numberValue(order.remainingAmount),
    paymentStatus: order.paymentStatus ?? undefined,
    fundsStatus: order.fundsStatus ?? undefined,
  };
};

export async function getMyOrders() {
  const response = await getRequest<ApiOrder[]>('/orders/my');
  return response.map(mapApiOrderToOrder);
}

export async function getOrderById(id: string) {
  const response = await getRequest<ApiOrder>(`/orders/${id}`);
  return mapApiOrderToOrder(response);
}

export async function getOrderTracking(id: string) {
  const response = await getRequest<ApiTrackingResponse>(`/orders/${id}/tracking`);
  return mapApiOrderToOrder(response);
}

export async function markOrderDelivered(id: string) {
  const response = await patchRequest<ApiOrder>(`/orders/${id}/mark-delivered`);
  return mapApiOrderToOrder(response);
}

export async function closeOrder(id: string) {
  const response = await patchRequest<ApiOrder>(`/orders/${id}/close`);
  return mapApiOrderToOrder(response);
}
