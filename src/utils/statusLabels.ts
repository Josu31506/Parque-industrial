export function getQuoteStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ADDED_TO_CART: 'Agregada al carrito',
    CANCELLED: 'Cancelada',
    CONSULTING_PRODUCER: 'En coordinación',
    CONVERTED_TO_ORDER: 'Convertida en pedido',
    EXPIRED: 'Expirada',
    IN_COORDINATION: 'En coordinación',
    PAID: 'Pagada',
    PENDING_REVIEW: 'Pendiente',
    PROPOSAL_RECEIVED: 'Propuesta recibida',
    REJECTED: 'Rechazada',
    RESOLUTION_SENT: 'Resuelta',
    RESOLVED: 'Resuelta',
  };

  return labels[status] || 'Pendiente';
}

export function getAvailabilityLabel(status: string | undefined): string {
  const labels: Record<string, string> = {
    CUSTOM_QUOTE: 'Requiere confirmación',
    IN_STOCK: 'En stock',
    MADE_TO_ORDER: 'Requiere confirmación',
  };

  return status ? labels[status] || 'No especificado' : 'No especificado';
}

export function getProductTypeLabel(type: string | undefined): string {
  const labels: Record<string, string> = {
    eco: 'Sostenible',
    ECO: 'Sostenible',
    featured: 'Destacado',
    FEATURED: 'Destacado',
    normal: 'Regular',
    NORMAL: 'Regular',
  };

  return type ? labels[type] || 'Regular' : 'Regular';
}

export function getActiveLabel(isActive: boolean | undefined): string {
  return isActive === false ? 'Inactivo' : 'Activo';
}

export function getConfirmationLabel(requiresConfirmation: boolean | undefined): string {
  return requiresConfirmation ? 'Requiere confirmación' : 'Compra directa';
}

export function getPurchaseRequestGroupStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    CONFIRMED: 'Confirmada',
    PENDING: 'Pendiente',
    REJECTED: 'Rechazada',
  };

  return labels[status] || 'Pendiente';
}

export function getSaleStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DELIVERED: 'Entregada',
    DISPATCHED: 'Despachada',
    HELD_BY_CLAIM: 'Retenida por reclamo',
    IN_PREPARATION: 'En preparación',
    IN_REVIEW: 'En revisión',
    LIQUIDATED: 'Liquidada',
    NEW_SALE: 'Nueva venta',
    READY_FOR_DISPATCH: 'Lista para despacho',
  };

  return labels[status] || 'Nueva venta';
}

export function getFundsStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    HELD: 'Retenido',
    HELD_BY_CLAIM: 'Retenido por reclamo',
    RELEASED: 'Liberado',
  };

  return labels[status] || 'Retenido';
}
