import type { ChangeEvent } from 'react';
import { useState } from 'react';
import type { Producer, Product, PurchaseRequest, PurchaseRequestGroup, Sale } from '../types';
import styles from './SellerDashboardView.module.css';

type SellerDashboardViewProps = {
  activeProducerId: string;
  products: Product[];
  producers: Producer[];
  requests: PurchaseRequest[];
  sales: Sale[];
  onChangeProducer: (producerId: string) => void;
  onConfirmRequest: (requestId: string, producerId: string, readyDate: string, observation: string) => void;
  onRejectRequest: (requestId: string, producerId: string, observation: string) => void;
  onMarkSaleInPreparation: (saleId: string) => void;
  onMarkSaleReady: (saleId: string) => void;
};

const formatMoney = (value: number) => `S/. ${value.toLocaleString('es-PE')}`;

export default function SellerDashboardView({
  activeProducerId,
  products,
  producers,
  requests,
  sales,
  onChangeProducer,
  onConfirmRequest,
  onRejectRequest,
  onMarkSaleInPreparation,
  onMarkSaleReady,
}: SellerDashboardViewProps) {
  const [tab, setTab] = useState<'requests' | 'sales' | 'products'>('requests');
  const [readyDates, setReadyDates] = useState<Record<string, string>>({});
  const [observations, setObservations] = useState<Record<string, string>>({});

  const sellerRequests = requests
    .map((request) => ({
      request,
      group: request.groupsByProducer.find((group) => group.producerId === activeProducerId),
    }))
    .filter((entry): entry is { request: PurchaseRequest; group: PurchaseRequestGroup } => Boolean(entry.group));

  const sellerSales = sales.filter((sale) => sale.producerId === activeProducerId);
  const sellerProducts = products.filter((product) => product.producerId === activeProducerId);

  const handleProducerChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChangeProducer(event.target.value);
  };

  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.heading}>
          <span className={styles.kicker}>Productor</span>
          <h1>Panel productor</h1>
          <p>Gestiona solicitudes de venta, ventas confirmadas y productos publicados.</p>
        </div>

        <div className={styles.toolbar}>
          <label>
            <span>Productora simulada</span>
            <select value={activeProducerId} onChange={handleProducerChange}>
              {producers.map((producer) => (
                <option key={producer.id} value={producer.id}>{producer.name}</option>
              ))}
            </select>
          </label>

          <div className={styles.tabs}>
            <button className={tab === 'requests' ? styles.active : undefined} type="button" onClick={() => setTab('requests')}>
              Solicitudes de venta
            </button>
            <button className={tab === 'sales' ? styles.active : undefined} type="button" onClick={() => setTab('sales')}>
              Ventas
            </button>
            <button className={tab === 'products' ? styles.active : undefined} type="button" onClick={() => setTab('products')}>
              Mis productos
            </button>
          </div>
        </div>

        {tab === 'requests' && (
          <div className={styles.list}>
            {sellerRequests.length === 0 ? (
              <div className={styles.empty}>No hay solicitudes para esta productora.</div>
            ) : sellerRequests.map(({ request, group }) => {
              const key = `${request.id}-${group.producerId}`;
              return (
                <article className={styles.card} key={key}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2>{request.id}</h2>
                      <p>Cliente: {request.customerName}</p>
                    </div>
                    <span className={styles.status}>{group.status}</span>
                  </div>

                  <div className={styles.items}>
                    {group.items.map((item) => (
                      <p key={item.productId}><span>{item.title}</span><strong>x{item.quantity}</strong></p>
                    ))}
                  </div>

                  {group.status === 'PENDING' ? (
                    <div className={styles.formGrid}>
                      <input
                        type="date"
                        value={readyDates[key] ?? ''}
                        onChange={(event) => setReadyDates((current) => ({ ...current, [key]: event.target.value }))}
                      />
                      <input
                        type="text"
                        placeholder="Observacion opcional"
                        value={observations[key] ?? ''}
                        onChange={(event) => setObservations((current) => ({ ...current, [key]: event.target.value }))}
                      />
                      <button
                        className="primaryButton"
                        type="button"
                        onClick={() => onConfirmRequest(request.id, group.producerId, readyDates[key] || new Date().toISOString().slice(0, 10), observations[key] ?? '')}
                      >
                        Confirmar disponibilidad
                      </button>
                      <button
                        className="accentButton"
                        type="button"
                        onClick={() => onRejectRequest(request.id, group.producerId, observations[key] || 'No disponible en la fecha solicitada.')}
                      >
                        Rechazar
                      </button>
                    </div>
                  ) : (
                    <div className={styles.groupFacts}>
                      <p><span>Fecha lista</span><strong>{group.readyDate ?? 'Pendiente'}</strong></p>
                      <p><span>Observacion</span><strong>{group.observation ?? 'Sin observacion'}</strong></p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {tab === 'sales' && (
          <div className={styles.list}>
            {sellerSales.length === 0 ? (
              <div className={styles.empty}>Aun no hay ventas confirmadas.</div>
            ) : sellerSales.map((sale) => (
              <article className={styles.card} key={sale.id}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2>{sale.id}</h2>
                    <p>Pedido {sale.orderId}</p>
                  </div>
                  <span className={styles.status}>{sale.status}</span>
                </div>

                <div className={styles.items}>
                  {sale.items.map((item) => (
                    <p key={item.productId}><span>{item.title}</span><strong>x{item.quantity}</strong></p>
                  ))}
                </div>

                <div className={styles.moneyGrid}>
                  <p><span>Bruto</span><strong>{formatMoney(sale.grossAmount)}</strong></p>
                  <p><span>Comision</span><strong>{formatMoney(sale.commissionAmount)}</strong></p>
                  <p><span>Neto</span><strong>{formatMoney(sale.netAmount)}</strong></p>
                  <p><span>Fondos</span><strong>{sale.fundsStatus}</strong></p>
                </div>

                <div className={styles.actions}>
                  <button className="primaryButton" type="button" onClick={() => onMarkSaleInPreparation(sale.id)}>
                    Marcar en preparacion
                  </button>
                  <button className="accentButton" type="button" onClick={() => onMarkSaleReady(sale.id)}>
                    Lista para despacho
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === 'products' && (
          <div className={styles.productGrid}>
            {sellerProducts.map((product) => (
              <article className={styles.productCard} key={product.id}>
                <span>{product.availabilityType}</span>
                <h2>{product.title}</h2>
                <p>{product.price}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
