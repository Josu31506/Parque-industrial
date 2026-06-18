import type { ApiProducer, Producer } from '../types';
import { getRequest, patchRequest } from './api';
import { mapApiProductToProduct } from './productsService';

export function mapApiProducerToProducer(apiProducer: ApiProducer): Producer {
  const businessName = apiProducer.businessName || 'Productora local';

  return {
    id: apiProducer.id,
    userId: apiProducer.userId,
    name: businessName,
    type: apiProducer.type || 'Productora local',
    location: apiProducer.location || 'Villa El Salvador',
    description: apiProducer.description || 'Productora registrada en Parque Industrial Conecta.',
    phone: apiProducer.phone ?? undefined,
    address: apiProducer.address ?? undefined,
    isApproved: apiProducer.isApproved,
    rating: apiProducer.rating ?? undefined,
    image: apiProducer.imageUrl ?? undefined,
    bankName: apiProducer.bankName ?? undefined,
    bankAccountNumber: apiProducer.bankAccountNumber ?? undefined,
    bankAccountType: apiProducer.bankAccountType ?? undefined,
    cci: apiProducer.cci ?? undefined,
    accountHolderName: apiProducer.accountHolderName ?? undefined,
    avatar: businessName.slice(0, 2).toUpperCase(),
  };
}

export async function getProducers() {
  const producers = await getRequest<ApiProducer[]>('/producers', { skipAuth: true });
  return (Array.isArray(producers) ? producers : []).map(mapApiProducerToProducer);
}

export async function getProducerById(id: string) {
  const producer = await getRequest<ApiProducer>(`/producers/${id}`, { skipAuth: true });
  return mapApiProducerToProducer(producer);
}

export async function getProductsByProducer(id: string) {
  const products = await getRequest<import('../types').ApiProduct[]>(`/producers/${id}/products`, { skipAuth: true });
  return products.map(mapApiProductToProduct);
}

export async function getMyProducer() {
  const producer = await getRequest<ApiProducer>('/producers/me');
  return mapApiProducerToProducer(producer);
}

export type ProducerProfileInput = {
  businessName?: string;
  type?: string;
  location?: string;
  description?: string;
  imageUrl?: string;
  phone?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountType?: string;
  cci?: string;
  accountHolderName?: string;
};

export async function updateMyProducer(data: ProducerProfileInput) {
  const producer = await patchRequest<ApiProducer, ProducerProfileInput>('/producers/me', data);
  return mapApiProducerToProducer(producer);
}
