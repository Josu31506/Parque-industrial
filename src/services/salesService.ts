import type { ApiSale, MarketplaceItem, Sale } from '../types';
import { getRequest, patchRequest } from './api';

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return undefined;
  return new Date(value).toLocaleDateString('es-PE');
};

const numberValue = (value: number | string | null | undefined) => Number(value ?? 0);

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

export async function getMySales() {
  const response = await getRequest<ApiSale[]>('/sales/my');
  return response.map(mapApiSaleToSale);
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
