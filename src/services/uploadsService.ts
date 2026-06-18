import { postFormRequest } from './api';

type UploadProductImageResponse = {
  url: string;
};

export function uploadProductImage(file: File): Promise<UploadProductImageResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return postFormRequest<UploadProductImageResponse>('/uploads/products', formData);
}

export function uploadClaimImage(file: File): Promise<UploadProductImageResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return postFormRequest<UploadProductImageResponse>('/uploads/claim-image', formData);
}

export function uploadProductModel(file: File): Promise<UploadProductImageResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return postFormRequest<UploadProductImageResponse>('/uploads/product-model', formData);
}
