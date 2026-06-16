import type {
  ApiQuote,
  ApiQuoteResolution,
  CreateQuoteInput,
  CreateQuoteResolutionInput,
  PaginatedResponse,
  Quote,
  QuoteResolution,
  QuoteStatus,
} from '../types';
import { getRequest, patchRequest, postRequest } from './api';

const formatDate = (value: string | null | undefined) => {
  if (!value) return undefined;
  return new Date(value).toLocaleDateString('es-PE');
};

type ApiQuotesResponse = ApiQuote[] | {
  items: ApiQuote[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
};

const normalizeReferenceImages = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const images = value.filter((item): item is string => typeof item === 'string' && Boolean(item));
  return images.length ? images : undefined;
};

const mapApiQuoteResolution = (resolution: ApiQuoteResolution): QuoteResolution => ({
  id: resolution.id,
  quoteRequestId: resolution.quoteRequestId,
  producerId: resolution.producerId,
  finalTitle: resolution.finalTitle,
  finalDescription: resolution.finalDescription,
  finalPrice: Number(resolution.finalPrice),
  deliveryTime: resolution.deliveryTime,
  notes: resolution.notes ?? undefined,
  validUntil: formatDate(resolution.validUntil),
  createdAt: formatDate(resolution.createdAt) ?? '',
  producer: resolution.producer,
});

export const mapApiQuoteToQuote = (quote: ApiQuote): Quote => ({
  id: quote.id,
  customerId: quote.customerId,
  type: quote.type,
  productId: quote.productId ?? undefined,
  status: quote.status,
  title: quote.title,
  description: quote.description,
  quantity: quote.quantity,
  requestedDimensions: quote.requestedDimensions ?? undefined,
  requestedMaterial: quote.requestedMaterial ?? undefined,
  requestedColor: quote.requestedColor ?? undefined,
  requestedFinish: quote.requestedFinish ?? undefined,
  deliveryDistrict: quote.deliveryDistrict ?? undefined,
  referenceImages: normalizeReferenceImages(quote.referenceImages),
  createdAt: formatDate(quote.createdAt) ?? '',
  updatedAt: formatDate(quote.updatedAt),
  customer: quote.customer,
  product: quote.product,
  resolutions: (quote.resolutions ?? []).map(mapApiQuoteResolution),
});

const normalizeQuotesResponse = (response: ApiQuotesResponse): PaginatedResponse<Quote> => {
  const items = Array.isArray(response) ? response : response.items;
  const page = Array.isArray(response) ? 1 : response.page;
  const limit = Array.isArray(response) ? items.length : response.limit;
  const total = Array.isArray(response) ? items.length : response.total;

  return {
    items: items.map(mapApiQuoteToQuote),
    total,
    page,
    limit,
    totalPages: Array.isArray(response) ? 1 : response.totalPages ?? Math.max(1, Math.ceil(total / limit)),
  };
};

export async function createQuote(data: CreateQuoteInput) {
  const response = await postRequest<ApiQuote, CreateQuoteInput>('/quotes', data);
  return mapApiQuoteToQuote(response);
}

export async function getMyQuotes(options: { limit?: number; page?: number } = {}) {
  if (import.meta.env.DEV) console.debug('[api] GET /quotes/my');
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 5),
  });
  const response = await getRequest<ApiQuotesResponse>(`/quotes/my?${params.toString()}`);
  return normalizeQuotesResponse(response);
}

export async function getAllQuotes() {
  const response = await getRequest<ApiQuotesResponse>('/quotes?page=1&limit=5');
  return normalizeQuotesResponse(response).items;
}

export async function getImageQuotes() {
  const response = await getRequest<ApiQuotesResponse>('/quotes/image?page=1&limit=5');
  return normalizeQuotesResponse(response).items;
}

export async function getSellerQuotes(options: { limit?: number; page?: number } = {}) {
  if (import.meta.env.DEV) console.debug('[api] GET /quotes/seller');
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 5),
  });
  const response = await getRequest<ApiQuotesResponse>(`/quotes/seller?${params.toString()}`);
  return normalizeQuotesResponse(response);
}

export async function getQuoteById(id: string) {
  const response = await getRequest<ApiQuote>(`/quotes/${id}`);
  return mapApiQuoteToQuote(response);
}

export async function updateQuoteStatus(id: string, status: QuoteStatus) {
  const response = await patchRequest<ApiQuote, { status: QuoteStatus }>(`/quotes/${id}/status`, { status });
  return mapApiQuoteToQuote(response);
}

export async function createQuoteResolution(id: string, data: CreateQuoteResolutionInput) {
  const response = await postRequest<ApiQuoteResolution, CreateQuoteResolutionInput>(`/quotes/${id}/resolution`, data);
  return mapApiQuoteResolution(response);
}

export async function addQuoteToCart(id: string) {
  const response = await postRequest<ApiQuote>(`/quotes/${id}/add-to-cart`);
  return mapApiQuoteToQuote(response);
}
