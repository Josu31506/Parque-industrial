import type { FormEvent } from 'react';
import { useState } from 'react';
import { uploadClaimImage } from '../services/uploadsService';
import type { Order, OrderStatus, Sale, ViewName } from '../types';
import { getOrderDisplayName } from '../utils/displayNames';
import styles from './OrderTrackingView.module.css';

type OrderTrackingViewProps = {
  order: Order | undefined;
  sales: Sale[];
  onConfirmReceived: (orderId: string) => void;
  onCreateClaim: (orderId: string, reason: string, description: string, evidenceImages?: string[]) => void;
  onNavigate: (view: ViewName) => void;
  onRefresh?: () => void;
  onVerifyOrder: (orderId: string) => void;
};

const steps = [
  'Pedido confirmado',
  'En preparacion',
  'Listo para despacho',
  'En camino',
  'Entregado',
  'Verificado',
];

const MAX_CLAIM_IMAGES = 5;
const MAX_CLAIM_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_CLAIM_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const getVisualStatus = (order: Order | undefined): OrderStatus | 'Listo para despacho' | 'Verificado' | undefined => {
  if (!order) return undefined;
  if (order.apiStatus === 'VERIFIED' || order.apiStatus === 'CLOSED') return 'Verificado';
  if (order.apiStatus === 'READY_FOR_DISPATCH') return 'Listo para despacho';
  return order.status;
};

const getCompletedSteps = (status: ReturnType<typeof getVisualStatus>) => {
  if (status === 'Pedido confirmado') return 0;
  if (status === 'En preparaciÃ³n' || status === 'En preparacion') return 1;
  if (status === 'Listo para despacho') return 2;
  if (status === 'En camino') return 3;
  if (status === 'Entregado') return 4;
  if (status === 'Verificado') return 5;
  return 1;
};

const producerStatusLabel = (status: Sale['status']) => {
  if (status === 'NEW_SALE') return 'Pendiente';
  if (status === 'IN_PREPARATION') return 'En preparacion';
  if (status === 'READY_FOR_DISPATCH') return 'Listo para despacho';
  if (status === 'DISPATCHED') return 'Despachado';
  if (status === 'DELIVERED') return 'Entregado';
  return 'En preparacion';
};

export default function OrderTrackingView({
  order,
  sales,
  onConfirmReceived,
  onCreateClaim,
  onNavigate,
  onRefresh,
  onVerifyOrder,
}: OrderTrackingViewProps) {
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimFiles, setClaimFiles] = useState<File[]>([]);
  const [claimError, setClaimError] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const visualStatus = getVisualStatus(order);
  const completedStepIndex = getCompletedSteps(visualStatus);
  const orderSales = order ? sales.filter((sale) => sale.orderId === order.id) : [];
  const readyProducers = orderSales.filter((sale) => (
    sale.status === 'READY_FOR_DISPATCH' || sale.status === 'DISPATCHED' || sale.status === 'DELIVERED'
  )).length;
  const canConfirmReceived = order?.apiStatus === 'DISPATCHED';
  const isInClaim = order?.apiStatus === 'IN_CLAIM' || order?.fundsStatus === 'HELD_BY_CLAIM';
  const claimDeadline = order?.claimDeadlineAt ? new Date(order.claimDeadlineAt) : null;
  const isVerified = order?.apiStatus === 'VERIFIED' || order?.apiStatus === 'CLOSED';
  const canVerifyDelivery = Boolean(order && order.apiStatus === 'DELIVERED' && !isInClaim);
  const canReportProblem = Boolean(
    order
    && order.apiStatus === 'DELIVERED'
    && !isVerified
    && order.fundsStatus !== 'RELEASED'
    && order.fundsStatus !== 'HELD_BY_CLAIM'
    && (!claimDeadline || new Date() <= claimDeadline),
  );
  const isClaimDeadlineExpired = Boolean(
    order
    && order.apiStatus === 'DELIVERED'
    && claimDeadline
    && new Date() > claimDeadline,
  );

  const handleClaimSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!order) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const reason = String(formData.get('reason') ?? 'Otro');
    const description = String(formData.get('description') ?? '').trim();

    if (description.length < 10) {
      setClaimError('La descripcion debe tener al menos 10 caracteres.');
      return;
    }

    setIsSubmittingClaim(true);
    setClaimError('');

    try {
      const evidenceImages = await Promise.all(
        claimFiles.map((file) => uploadClaimImage(file).then((response) => response.url)),
      );
      onCreateClaim(order.id, reason, description, evidenceImages);
      setShowClaimForm(false);
      setClaimFiles([]);
      form.reset();
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const handleClaimFileChange = (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    const nextFiles = [...claimFiles, ...selectedFiles].slice(0, MAX_CLAIM_IMAGES);
    const invalidFile = nextFiles.find((file) => (
      !ALLOWED_CLAIM_IMAGE_TYPES.has(file.type) || file.size > MAX_CLAIM_IMAGE_SIZE
    ));

    if (selectedFiles.length + claimFiles.length > MAX_CLAIM_IMAGES) {
      setClaimError('Puedes adjuntar como maximo 5 imagenes.');
      return;
    }

    if (invalidFile) {
      setClaimError('Las fotos deben ser JPG, PNG o WEBP y pesar como maximo 5 MB.');
      return;
    }

    setClaimError('');
    setClaimFiles(nextFiles);
  };

  const handleDeliveredClick = () => {
    if (!order) return;
    const confirmed = window.confirm(
      'Confirmas que recibiste el pedido? Al marcarlo como entregado podras reportar un problema solo dentro del plazo de reclamo. Luego deberas verificar la entrega si todo esta conforme.',
    );
    if (confirmed) onConfirmReceived(order.id);
  };

  const handleVerifyClick = () => {
    if (!order) return;
    const confirmed = window.confirm(
      'Al verificar este pedido confirmas que recibiste los productos correctamente y que no tienes problemas que reportar. Despues de verificarlo ya no podras iniciar un reclamo. El pago sera liberado al productor.',
    );
    if (confirmed) onVerifyOrder(order.id);
  };

  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.heading}>
          <h1>Estado de tu pedido</h1>
          <p>
            {order
              ? `Tu pedido se encuentra actualmente en estado: ${visualStatus}.`
              : 'No pudimos encontrar la informacion de este pedido.'}
          </p>
        </div>

        {order ? (
          <>
            <div className={styles.card}>
              <div className={styles.summary}>
                <div>
                  <span className={styles.label}>Pedido</span>
                  <strong>{getOrderDisplayName(order)}</strong>
                </div>

                <div>
                  <span className={styles.label}>Entrega estimada</span>
                  <strong>{order.estimatedDeliveryDate ?? 'Pendiente'}</strong>
                  {order.claimDeadlineAt && order.apiStatus === 'DELIVERED' && (
                    <small>Reclamos hasta: {new Date(order.claimDeadlineAt).toLocaleDateString('es-PE')}</small>
                  )}
                </div>

                <div>
                  <span className={styles.label}>Productores listos</span>
                  <strong>{readyProducers} de {orderSales.length || order.producerGroups?.length || 0}</strong>
                </div>

                <div>
                  <span className={styles.label}>Fondos</span>
                  <strong className={styles.status}>{order.fundsStatus ?? 'HELD'}</strong>
                </div>
              </div>

              <div className={styles.timeline}>
                {isInClaim && (
                  <p className={styles.claimNotice}>Este pedido tiene un reclamo en revision. Los fondos permaneceran retenidos hasta resolverlo.</p>
                )}
                {isClaimDeadlineExpired && (
                  <p className={styles.claimNotice}>El plazo para reportar problemas de este pedido vencio.</p>
                )}
                {isVerified && (
                  <p className={styles.verifiedNotice}>Pedido verificado. Ya no es posible iniciar reclamos.</p>
                )}
                {steps.map((step, index) => {
                  const isDone = index <= completedStepIndex;
                  const isCurrent = index === completedStepIndex;

                  return (
                    <article
                      className={`${styles.step} ${isDone ? styles.done : ''} ${isCurrent ? styles.current : ''}`}
                      key={step}
                    >
                      <div className={styles.marker}>
                        {isDone ? '✓' : index + 1}
                      </div>

                      <div className={styles.stepContent}>
                        <h2>{step}</h2>
                        <p>
                          {isCurrent
                            ? 'Este es el estado actual de tu pedido.'
                            : isDone
                              ? 'Etapa completada.'
                              : 'Pendiente.'}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className={styles.producerGrid}>
              {(orderSales.length > 0 ? orderSales : order.producerGroups ?? []).map((group) => (
                <article className={styles.producerCard} key={group.producerId}>
                  <div className={styles.producerHeader}>
                    <h2>{group.producerName}</h2>
                    <span>{'status' in group ? producerStatusLabel(group.status) : 'En preparacion'}</span>
                  </div>
                  <div className={styles.productList}>
                    {group.items.map((item) => (
                      <p key={item.productId ?? item.quoteId ?? item.title}><span>{item.title}</span><strong>x{item.quantity}</strong></p>
                    ))}
                  </div>
                  <p><strong>Fecha comprometida:</strong> {group.readyDate ?? 'Pendiente'}</p>
                  <p><strong>Observacion:</strong> {group.observation ?? 'Sin observacion'}</p>
                </article>
              ))}
            </div>

            {showClaimForm && (
              <form className={styles.claimForm} onSubmit={handleClaimSubmit}>
                <h2>Reportar problema</h2>
                <p>Describe el problema y adjunta fotos para que podamos revisar tu caso.</p>
                <select name="reason" required>
                  <option value="Producto danado evidencia">Producto danado</option>
                  <option value="Producto incorrecto">Producto incorrecto</option>
                  <option value="Faltan productos">Faltan productos</option>
                  <option value="Mala calidad">Mala calidad</option>
                  <option value="Entrega incompleta">Entrega incompleta</option>
                  <option value="Otro">Otro</option>
                </select>
                <textarea minLength={10} name="description" placeholder="Describe brevemente el problema" required />
                <input
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  type="file"
                  onChange={(event) => handleClaimFileChange(event.target.files)}
                />
                {claimFiles.length > 0 && (
                  <div className={styles.previewGrid}>
                    {claimFiles.map((file) => (
                      <div className={styles.previewItem} key={`${file.name}-${file.lastModified}`}>
                        <img alt={file.name} src={URL.createObjectURL(file)} />
                        <span>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setClaimFiles((current) => current.filter((entry) => entry !== file))}
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {claimError && <p className={styles.claimError}>{claimError}</p>}
                <button className="primaryButton" type="submit" disabled={isSubmittingClaim}>
                  {isSubmittingClaim ? 'Enviando...' : 'Enviar reclamo'}
                </button>
                <button type="button" onClick={() => {
                  setShowClaimForm(false);
                  setClaimFiles([]);
                  setClaimError('');
                }}>
                  Cancelar
                </button>
              </form>
            )}
          </>
        ) : (
          <div className={styles.empty}>
            <p>Pedido no encontrado.</p>
          </div>
        )}

        <div className={styles.actions}>
          <button className="primaryButton" type="button" onClick={() => onNavigate('orders')}>
            Volver a pedidos
          </button>
          {onRefresh && (
            <button className={styles.refreshButton} type="button" onClick={onRefresh}>
              Actualizar
            </button>
          )}
          {order && (
            <>
              {canConfirmReceived && (
                <button className="primaryButton" type="button" onClick={handleDeliveredClick}>
                  Marcar como entregado
                </button>
              )}
              {canVerifyDelivery && (
                <button className="primaryButton" type="button" onClick={handleVerifyClick}>
                  Verificar entrega
                </button>
              )}
              {canReportProblem && (
                <button className="accentButton" type="button" onClick={() => setShowClaimForm((current) => !current)}>
                  Reportar problema
                </button>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
