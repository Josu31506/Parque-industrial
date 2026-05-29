import type { ApiCategory, Category } from '../types';
import { getRequest } from './api';

export function mapApiCategoryToCategory(apiCategory: ApiCategory): Category {
  return {
    id: apiCategory.id,
    name: apiCategory.name,
    description: apiCategory.description ?? undefined,
    icon: apiCategory.icon ?? undefined,
    image: apiCategory.icon ?? 'linear-gradient(135deg, #e59866, #f7eee8)',
    rating: 4.8,
    reviews: 0,
  };
}

export async function getCategories() {
  const categories = await getRequest<ApiCategory[]>('/categories', { skipAuth: true });
  return categories.map(mapApiCategoryToCategory);
}
