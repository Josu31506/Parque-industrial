import type { ApiCartItem, CartItem } from '../types';
import { deleteRequest, getRequest, patchRequest, postRequest } from './api';

type ApiCartResponse = ApiCartItem[] | { items?: ApiCartItem[] };

const mapApiCartItem = (item: ApiCartItem): CartItem => ({
  id: item.id,
  productId: item.productId,
  quantity: item.quantity,
});

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

export async function updateCartItem(cartItemId: string, quantity: number) {
  const response = await patchRequest<ApiCartItem>(`/cart/items/${cartItemId}`, { quantity });
  return mapApiCartItem(response);
}

export function removeCartItem(cartItemId: string) {
  return deleteRequest<ApiCartItem>(`/cart/items/${cartItemId}`);
}

export function clearCart() {
  return deleteRequest<{ count?: number }>('/cart/clear');
}
