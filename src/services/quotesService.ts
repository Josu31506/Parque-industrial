import { getRequest, postRequest } from './api';

export function createQuote(body: unknown) {
  return postRequest('/quotes', body);
}

export function getMyQuotes() {
  return getRequest('/quotes/my');
}

export function getAllQuotes() {
  return getRequest('/quotes');
}

export function getQuoteById(id: string) {
  return getRequest(`/quotes/${id}`);
}
