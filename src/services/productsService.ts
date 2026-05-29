import type { ApiProduct, CatalogFilter, Product, ProductType } from '../types';
import { getRequest } from './api';

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

const mapProductType = (type: string | undefined): ProductType => (
  type === 'ECO' ? 'eco' : 'featured'
);

export function mapApiProductToProduct(apiProduct: ApiProduct): Product {
  const numericPrice = Number(apiProduct.numericPrice ?? apiProduct.price ?? 0);

  return {
    id: apiProduct.id,
    title: apiProduct.title,
    description: apiProduct.description,
    price: money(apiProduct.price ?? numericPrice),
    numericPrice,
    image: apiProduct.imageUrl,
    storeName: apiProduct.producer?.businessName ?? 'Productora local',
    category: apiProduct.category?.name,
    categoryId: apiProduct.categoryId,
    producerId: apiProduct.producerId,
    badge: apiProduct.badge,
    type: mapProductType(apiProduct.type),
    availabilityType: apiProduct.availabilityType,
    stock: apiProduct.stock ?? undefined,
    estimatedDispatchDays: apiProduct.estimatedDispatchDays ?? undefined,
    requiresConfirmation: apiProduct.availabilityType === 'MADE_TO_ORDER',
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
