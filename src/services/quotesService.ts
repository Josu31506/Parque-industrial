import type {
  ApiQuote,
  ApiQuoteResolution,
  CreateQuoteInput,
  CreateQuoteResolutionInput,
  Quote,
  QuoteResolution,
  QuoteStatus,
} from '../types';
import { getRequest, patchRequest, postRequest } from './api';

const formatDate = (value: string | null | undefined) => {
  if (!value) return undefined;
  return new Date(value).toLocaleDateString('es-PE');
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

export async function createQuote(data: CreateQuoteInput) {
  const response = await postRequest<ApiQuote, CreateQuoteInput>('/quotes', data);
  return mapApiQuoteToQuote(response);
}

export async function getMyQuotes() {
  const response = await getRequest<ApiQuote[]>('/quotes/my');
  return response.map(mapApiQuoteToQuote);
}

export async function getAllQuotes() {
  const response = await getRequest<ApiQuote[]>('/quotes');
  return response.map(mapApiQuoteToQuote);
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
