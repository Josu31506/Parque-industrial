import type { ApiSale, MarketplaceItem, PaginatedResponse, Sale } from '../types';
import { getRequest, patchRequest } from './api';

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return undefined;
  return new Date(value).toLocaleDateString('es-PE');
};

const numberValue = (value: number | string | null | undefined) => Number(value ?? 0);
type ApiSalesResponse = ApiSale[] | {
  items: ApiSale[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
};

export const mapApiSaleToSale = (sale: ApiSale): Sale => {
  const producerName = sale.producerName ?? sale.producer?.businessName ?? 'Productor no asignado';
  const items: MarketplaceItem[] = (sale.items ?? []).map((item) => {
    const unitPrice = numberValue(item.unitPrice);

    return {
      productId: item.productId,
      quantity: item.quantity,
      title: item.product?.title ?? 'Producto no disponible',
      price: `S/. ${unitPrice.toLocaleString('es-PE')}`,
      numericPrice: unitPrice,
      producerId: sale.producerId,
      producerName,
    };
  });

  return {
    id: sale.id,
    orderId: sale.orderId,
    producerId: sale.producerId,
    producerName,
    items,
    grossAmount: numberValue(sale.grossAmount),
    commissionAmount: numberValue(sale.commissionAmount),
    netAmount: numberValue(sale.netAmount),
    status: sale.status,
    paymentStatus: sale.paymentStatus,
    fundsStatus: sale.fundsStatus,
    readyDate: formatDate(sale.readyDate),
    observation: sale.observation ?? undefined,
    createdAt: formatDate(sale.createdAt) ?? '',
  };
};

const normalizeSalesResponse = (response: ApiSalesResponse): PaginatedResponse<Sale> => {
  const items = Array.isArray(response) ? response : response.items;
  const page = Array.isArray(response) ? 1 : response.page;
  const limit = Array.isArray(response) ? items.length : response.limit;
  const total = Array.isArray(response) ? items.length : response.total;

  return {
    items: items.map(mapApiSaleToSale),
    total,
    page,
    limit,
    totalPages: Array.isArray(response) ? 1 : response.totalPages ?? Math.max(1, Math.ceil(total / limit)),
  };
};

export async function getMySales(options: { limit?: number; page?: number } = {}) {
  if (import.meta.env.DEV) console.debug('[api] GET /sales/my');
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 5),
  });
  const response = await getRequest<ApiSalesResponse>(`/sales/my?${params.toString()}`);
  return normalizeSalesResponse(response);
}

export async function getSaleById(id: string) {
  const response = await getRequest<ApiSale>(`/sales/${id}`);
  return mapApiSaleToSale(response);
}

export async function markSaleInPreparation(id: string) {
  const response = await patchRequest<ApiSale>(`/sales/${id}/in-preparation`);
  return mapApiSaleToSale(response);
}

export async function markSaleReadyForDispatch(id: string) {
  const response = await patchRequest<ApiSale>(`/sales/${id}/ready-for-dispatch`);
  return mapApiSaleToSale(response);
}

export async function markSaleDispatched(id: string) {
  const response = await patchRequest<ApiSale>(`/sales/${id}/dispatched`);
  return mapApiSaleToSale(response);
}

export async function markSaleDelivered(id: string) {
  const response = await patchRequest<ApiSale>(`/sales/${id}/delivered`);
  return mapApiSaleToSale(response);
}
