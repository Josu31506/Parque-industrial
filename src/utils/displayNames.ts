export const getProductDisplayName = (product?: { title?: string | null }) => (
  product?.title?.trim() || 'Producto no disponible'
);

export const getProducerDisplayName = (
  producer?: { businessName?: string | null; name?: string | null },
) => (
  producer?.businessName?.trim() || producer?.name?.trim() || 'Productor no asignado'
);

export const getCategoryDisplayName = (
  category?: { name?: string | null },
  fallbackName?: string | null,
) => (
  category?.name?.trim() || fallbackName?.trim() || 'Categoria no asignada'
);

export const getCustomerDisplayName = (
  customer?: { name?: string | null; email?: string | null },
) => (
  customer?.name?.trim() || customer?.email?.trim() || 'Cliente no disponible'
);

export const getOrderDisplayName = (order?: { date?: string | null }) => (
  order?.date ? `Pedido del ${order.date}` : 'Pedido reciente'
);

export const getSaleDisplayName = (sale?: { items?: Array<{ title?: string | null }> }) => {
  const firstProduct = sale?.items?.[0]?.title?.trim();
  if (!firstProduct) return 'Venta registrada';
  return sale.items && sale.items.length > 1
    ? `${firstProduct} y ${sale.items.length - 1} producto(s) mas`
    : firstProduct;
};
