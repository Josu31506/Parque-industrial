import type { ApiCartItem, CartItem } from '../types';
import { deleteRequest, getRequest, patchRequest, postRequest } from './api';
import { mapApiProductToProduct } from './productsService';

type ApiCartResponse = ApiCartItem[] | { items?: ApiCartItem[] };

const mapApiCartItem = (item: ApiCartItem): CartItem => ({
  id: item.id,
  productId: item.productId ?? undefined,
  quoteId: item.quoteId ?? undefined,
  titleSnapshot: item.titleSnapshot ?? undefined,
  quotedPriceSnapshot: item.quotedPriceSnapshot === null || item.quotedPriceSnapshot === undefined
    ? undefined
    : Number(item.quotedPriceSnapshot),
  quantity: item.quantity,
  product: item.product ? mapApiProductToProduct(item.product) : mapQuoteItemToProduct(item),
});

const mapQuoteItemToProduct = (item: ApiCartItem) => {
  if (!item.quoteId || !item.quote) return undefined;
  const unitPrice = Number(item.quotedPriceSnapshot ?? item.quote.quotedPrice ?? 0);
  const producerName = item.quote.product?.producer?.businessName ?? 'Productora por confirmar';

  return {
    id: item.quoteId,
    title: item.titleSnapshot ?? item.quote.product?.title ?? item.quote.title,
    price: `S/. ${unitPrice.toLocaleString('es-PE')}`,
    numericPrice: unitPrice,
    image: item.quote.product?.imageUrl ?? '',
    storeName: producerName,
    description: item.quote.description,
    badge: 'Cotizacion',
    type: 'normal' as const,
    producerId: item.quote.producerId ?? item.quote.product?.producerId ?? undefined,
    availabilityType: 'IN_STOCK' as const,
    requiresConfirmation: false,
  };
};

const normalizeCart = (response: ApiCartResponse): CartItem[] => {
  const items = Array.isArray(response) ? response : response.items ?? [];
  return items.map(mapApiCartItem);
};

export async function getCart() {
  const response = await getRequest<ApiCartResponse>('/cart');
  return normalizeCart(response);
}

export async function addCartItem(productId: string, quantity = 1) {
  const response = await postRequest<ApiCartItem>('/cart/items', { productId, quantity });
  return mapApiCartItem(response);
}

export async function addQuoteCartItem(quoteId: string, quantity = 1) {
  const response = await postRequest<ApiCartItem>('/cart/items', { quoteId, quantity });
  return mapApiCartItem(response);
}

export async function updateCartItem(cartItemId: string, quantity: number) {
  const response = await patchRequest<ApiCartItem>(`/cart/items/${cartItemId}`, { quantity });
  return mapApiCartItem(response);
}

export function removeCartItem(cartItemId: string) {
  return deleteRequest<ApiCartItem | { id: string; deleted: true }>(`/cart/items/${cartItemId}`);
}

export function clearCart() {
  return deleteRequest<{ count?: number }>('/cart/clear');
}
