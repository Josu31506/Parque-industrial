import type { ApiProducer, Producer } from '../types';
import { getRequest } from './api';
import { mapApiProductToProduct } from './productsService';

export function mapApiProducerToProducer(apiProducer: ApiProducer): Producer {
  return {
    id: apiProducer.id,
    name: apiProducer.businessName,
    type: apiProducer.type,
    location: apiProducer.location,
    description: apiProducer.description,
    avatar: apiProducer.businessName.slice(0, 2).toUpperCase(),
  };
}

export async function getProducers() {
  const producers = await getRequest<ApiProducer[]>('/producers', { skipAuth: true });
  return producers.map(mapApiProducerToProducer);
}

export async function getProducerById(id: string) {
  const producer = await getRequest<ApiProducer>(`/producers/${id}`, { skipAuth: true });
  return mapApiProducerToProducer(producer);
}

export async function getProductsByProducer(id: string) {
  const products = await getRequest<import('../types').ApiProduct[]>(`/producers/${id}/products`, { skipAuth: true });
  return products.map(mapApiProductToProduct);
}
