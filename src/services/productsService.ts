import type { ApiProduct, AvailabilityType, CatalogFilter, Product, ProductType } from '../types';
import { deleteRequest, getRequest, patchRequest, postRequest } from './api';

type ApiProductsResponse = {
  items: ApiProduct[];
  total: number;
  page: number;
  limit: number;
};

const money = (value: number | string) => {
  const numeric = Number(value);
  return Number.isNaN(numeric) ? `S/. ${value}` : `S/. ${numeric.toLocaleString('es-PE')}`;
};

const mapProductType = (type: string | undefined): ProductType => {
  if (type === 'ECO') return 'eco';
  if (type === 'NORMAL') return 'normal';
  return 'featured';
};

const mapProductTypeToApi = (type: ProductType) => {
  if (type === 'eco') return 'ECO';
  return 'FEATURED';
};

export function mapApiProductToProduct(apiProduct: ApiProduct): Product {
  const numericPrice = Number(apiProduct.numericPrice ?? apiProduct.price ?? 0);
  const requiresConfirmation = apiProduct.requiresConfirmation === true
    || apiProduct.availabilityType === 'MADE_TO_ORDER'
    || apiProduct.availabilityType === 'CUSTOM_QUOTE';

  return {
    id: apiProduct.id,
    slug: apiProduct.slug,
    title: apiProduct.title,
    description: apiProduct.description,
    price: money(apiProduct.price ?? numericPrice),
    numericPrice,
    image: apiProduct.imageUrl,
    storeName: apiProduct.producer?.businessName ?? 'Productor no asignado',
    category: apiProduct.category?.name,
    categoryId: apiProduct.categoryId,
    producerId: apiProduct.producerId,
    badge: apiProduct.badge,
    type: mapProductType(apiProduct.type),
    availabilityType: apiProduct.availabilityType === 'CUSTOM_QUOTE' ? 'MADE_TO_ORDER' : apiProduct.availabilityType,
    stock: apiProduct.stock ?? undefined,
    estimatedDispatchDays: apiProduct.estimatedDispatchDays ?? undefined,
    requiresConfirmation,
    customizable: apiProduct.customizable,
    isActive: apiProduct.isActive ?? true,
    technicalDetails: {
      dimensions: apiProduct.dimensions ?? undefined,
      materials: apiProduct.materials ?? undefined,
      colors: Array.isArray(apiProduct.colors) ? apiProduct.colors : undefined,
      finish: apiProduct.finish ?? undefined,
      customizable: apiProduct.customizable,
    },
  };
}

const toQuery = (filters?: CatalogFilter) => {
  const params = new URLSearchParams();
  if (!filters) return '';
  if (filters.query) params.set('search', filters.query);
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.producer) params.set('producerId', filters.producer);
  if (filters.type) params.set('type', filters.type === 'eco' ? 'ECO' : 'FEATURED');
  return params.toString() ? `?${params.toString()}` : '';
};

export type ProductFormInput = {
  availabilityType: AvailabilityType;
  badge?: string;
  categoryId?: string;
  customizable?: boolean;
  description: string;
  dimensions?: string;
  estimatedDispatchDays?: number | null;
  finish?: string;
  imageUrl: string;
  isActive?: boolean;
  materials?: string;
  numericPrice: number;
  producerId?: string;
  requiresConfirmation?: boolean;
  stock?: number | null;
  title: string;
  type: ProductType;
  colors?: string[];
};

const toApiProductBody = (data: ProductFormInput) => ({
  availabilityType: data.requiresConfirmation || data.availabilityType === 'CUSTOM_QUOTE'
    ? 'MADE_TO_ORDER'
    : 'IN_STOCK',
  badge: data.badge || undefined,
  categoryId: data.categoryId || undefined,
  colors: data.colors?.filter(Boolean) ?? [],
  customizable: data.customizable ?? false,
  description: data.description,
  dimensions: data.dimensions || undefined,
  estimatedDispatchDays: data.estimatedDispatchDays ?? undefined,
  finish: data.finish || undefined,
  imageUrl: data.imageUrl,
  isActive: data.isActive ?? true,
  materials: data.materials || undefined,
  numericPrice: data.numericPrice,
  price: data.numericPrice,
  producerId: data.producerId || undefined,
  requiresConfirmation: data.requiresConfirmation ?? false,
  stock: data.stock ?? undefined,
  title: data.title,
  type: mapProductTypeToApi(data.type),
});

export async function getProducts(filters?: CatalogFilter) {
  const response = await getRequest<ApiProductsResponse>(`/products${toQuery(filters)}`, { skipAuth: true });
  return response.items.map(mapApiProductToProduct);
}

export async function getProductById(id: string) {
  const product = await getRequest<ApiProduct>(`/products/${id}`, { skipAuth: true });
  return mapApiProductToProduct(product);
}

export async function getFeaturedProducts() {
  const products = await getProducts({ type: 'featured' });
  return products;
}

export async function getEcoProducts() {
  const products = await getProducts({ type: 'eco' });
  return products;
}

export async function getMyProducts() {
  try {
    const response = await getRequest<ApiProduct[]>('/products/my');
    return response.map(mapApiProductToProduct);
  } catch {
    return [];
  }
}

export async function createProduct(data: ProductFormInput) {
  const product = await postRequest<ApiProduct, ReturnType<typeof toApiProductBody>>('/products', toApiProductBody(data));
  return mapApiProductToProduct(product);
}

export async function updateProduct(id: string, data: ProductFormInput) {
  const product = await patchRequest<ApiProduct, ReturnType<typeof toApiProductBody>>(`/products/${id}`, toApiProductBody(data));
  return mapApiProductToProduct(product);
}

export async function deactivateProduct(id: string) {
  try {
    await deleteRequest(`/products/${id}`);
  } catch {
    await patchRequest<ApiProduct, { isActive: boolean }>(`/products/${id}`, { isActive: false });
  }
}
