import type { ApiProduct, AvailabilityType, CatalogFilter, PaginatedResponse, Product, ProductType } from '../types';
import { deleteRequest, getRequest, patchRequest, postRequest } from './api';

type ApiProductsResponse = ApiProduct[] | {
  items: ApiProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
};

type ProductQuery = CatalogFilter & {
  limit?: number;
  page?: number;
};

const money = (value: number | string) => {
  const numeric = Number(value);
  return Number.isNaN(numeric) ? `S/. ${value}` : `S/. ${numeric.toLocaleString('es-PE')}`;
};

const productImageFallback = 'linear-gradient(135deg, #d9c7b5, #f3eee8)';

const demoModelByProductHint = [
  {
    hints: ['sofa-modular-lino-gris', 'sofa modular', 'escritorio de madera recuperada'],
    url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
  },
  {
    hints: ['mesa-comedor-extensible', 'mesa de comedor', 'comedor de roble personalizado'],
    url: 'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb',
  },
  {
    hints: ['banco-madera-recuperada', 'banco de madera recuperada'],
    url: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
  },
];

const getDemoModelUrl = (apiProduct: ApiProduct, title: string) => {
  const lookupValue = `${apiProduct.id ?? ''} ${apiProduct.slug ?? ''} ${title}`.toLowerCase();
  return demoModelByProductHint.find((entry) => (
    entry.hints.some((hint) => lookupValue.includes(hint))
  ))?.url;
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
  const safeTitle = String(apiProduct.title || 'Producto sin nombre').trim();
  const requiresConfirmation = apiProduct.requiresConfirmation === true
    || apiProduct.availabilityType === 'MADE_TO_ORDER'
    || apiProduct.availabilityType === 'CUSTOM_QUOTE';

  return {
    id: String(apiProduct.id),
    slug: apiProduct.slug,
    title: safeTitle,
    description: apiProduct.description ?? '',
    price: money(apiProduct.price ?? numericPrice),
    numericPrice: Number.isFinite(numericPrice) ? numericPrice : 0,
    image: apiProduct.imageUrl || productImageFallback,
    model3dUrl: apiProduct.model3dUrl || undefined,
    storeName: apiProduct.producer?.businessName ?? 'Productor no asignado',
    category: apiProduct.category?.name,
    categoryId: apiProduct.categoryId,
    producerId: apiProduct.producerId,
    badge: apiProduct.badge,
    type: mapProductType(apiProduct.type),
    availabilityType: apiProduct.availabilityType ?? 'IN_STOCK',
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

const toQuery = (filters?: ProductQuery) => {
  const params = new URLSearchParams();
  if (filters?.query) params.set('search', filters.query);
  if (filters?.categoryId) params.set('categoryId', filters.categoryId);
  if (filters?.producer) params.set('producerId', filters.producer);
  if (filters?.type) params.set('type', filters.type === 'eco' ? 'ECO' : 'FEATURED');
  params.set('page', String(filters?.page ?? 1));
  params.set('limit', String(filters?.limit ?? 20));
  return params.toString() ? `?${params.toString()}` : '';
};

const normalizeProductsResponse = (response: ApiProductsResponse): PaginatedResponse<Product> => {
  const items = Array.isArray(response) ? response : response?.items ?? [];
  const page = Array.isArray(response) ? 1 : response.page;
  const limit = Array.isArray(response) ? items.length : response.limit;
  const total = Array.isArray(response) ? items.length : response.total;

  return {
    items: items
      .filter((item) => Boolean(item?.id))
      .map(mapApiProductToProduct),
    total: Number(total) || items.length,
    page: Number(page) || 1,
    limit: Number(limit) || items.length || 20,
    totalPages: Array.isArray(response) ? 1 : response.totalPages ?? Math.max(1, Math.ceil((Number(total) || items.length) / (Number(limit) || 20))),
  };
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
  model3dUrl?: string | null;
};

const normalizeProductPayload = (data: ProductFormInput) => ({
  availabilityType: data.requiresConfirmation || data.availabilityType === 'CUSTOM_QUOTE'
    ? 'MADE_TO_ORDER'
    : 'IN_STOCK',
  badge: data.badge || undefined,
  categoryId: data.categoryId || undefined,
  colors: data.colors?.filter(Boolean) ?? [],
  customizable: data.customizable ?? false,
  description: data.description,
  dimensions: data.dimensions || undefined,
  estimatedDispatchDays: data.estimatedDispatchDays === null || data.estimatedDispatchDays === undefined
    ? undefined
    : Number(data.estimatedDispatchDays),
  finish: data.finish || undefined,
  imageUrl: data.imageUrl,
  isActive: data.isActive ?? true,
  materials: data.materials || undefined,
  numericPrice: Number(data.numericPrice),
  producerId: data.producerId || undefined,
  requiresConfirmation: data.requiresConfirmation ?? false,
  stock: data.stock === null || data.stock === undefined ? undefined : Number(data.stock),
  title: data.title,
  type: mapProductTypeToApi(data.type),
  model3dUrl: data.model3dUrl === null ? null : (data.model3dUrl || undefined),
});

export async function getProducts(filters?: ProductQuery) {
  if (import.meta.env.DEV) console.debug('[api] GET /products');
  const response = await getRequest<ApiProductsResponse>(`/products${toQuery(filters)}`, { skipAuth: true });
  return normalizeProductsResponse(response);
}

export async function getProductById(id: string) {
  const product = await getRequest<ApiProduct>(`/products/${id}`, { skipAuth: true });
  return mapApiProductToProduct(product);
}

export async function getFeaturedProducts() {
  const products = await getProducts({ limit: 20, type: 'featured' });
  return products.items;
}

export async function getEcoProducts() {
  const products = await getProducts({ limit: 20, type: 'eco' });
  return products.items;
}

export async function getMyProducts(options: { limit?: number; page?: number } = {}) {
  if (import.meta.env.DEV) console.debug('[api] GET /products/my');
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 20),
  });
  const response = await getRequest<ApiProductsResponse>(`/products/my?${params.toString()}`);
  return normalizeProductsResponse(response);
}

export async function createProduct(data: ProductFormInput) {
  const product = await postRequest<ApiProduct, ReturnType<typeof normalizeProductPayload>>('/products', normalizeProductPayload(data));
  return mapApiProductToProduct(product);
}

export async function updateProduct(id: string, data: ProductFormInput) {
  const product = await patchRequest<ApiProduct, ReturnType<typeof normalizeProductPayload>>(`/products/${id}`, normalizeProductPayload(data));
  return mapApiProductToProduct(product);
}

export async function deactivateProduct(id: string) {
  try {
    const product = await deleteRequest<ApiProduct>(`/products/${id}`);
    return mapApiProductToProduct(product);
  } catch {
    const product = await patchRequest<ApiProduct, { isActive: boolean }>(`/products/${id}`, { isActive: false });
    return mapApiProductToProduct(product);
  }
}
