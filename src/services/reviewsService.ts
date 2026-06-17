import type {
  ApiReview,
  ApiReviewsResponse,
  PaginatedResponse,
  Review,
  ReviewEligibility,
  ReviewsSummary,
} from '../types';
import { getRequest, postRequest } from './api';

type CreateReviewInput = {
  productId: string;
  orderId: string;
  rating: number;
  comment?: string;
};

const formatDate = (value: string) => new Date(value).toLocaleDateString('es-PE');

export const mapApiReviewToReview = (review: ApiReview): Review => ({
  id: review.id,
  productId: review.productId,
  orderId: review.orderId,
  userName: review.customer?.name ?? 'Cliente verificado',
  rating: review.rating,
  comment: review.comment ?? '',
  date: formatDate(review.createdAt),
  verified: true,
});

export async function getProductReviews(productId: string, page = 1, limit = 5) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const response = await getRequest<ApiReviewsResponse>(`/reviews/product/${productId}?${params.toString()}`, {
    skipAuth: true,
  });

  return {
    ...response,
    items: response.items.map(mapApiReviewToReview),
  } satisfies PaginatedResponse<Review> & { summary: ReviewsSummary };
}

export function getReviewEligibility(productId: string) {
  return getRequest<ReviewEligibility>(`/reviews/product/${productId}/eligibility`);
}

export async function createReview(input: CreateReviewInput) {
  const response = await postRequest<ApiReview, CreateReviewInput>('/reviews', input);
  return mapApiReviewToReview(response);
}
