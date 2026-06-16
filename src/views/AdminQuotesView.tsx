import { useEffect, useMemo, useState } from 'react';
import { getImageQuotes } from '../services/quotesService';
import type { Quote, QuoteStatus } from '../types';
import { getCustomerDisplayName } from '../utils/displayNames';
import { getQuoteStatusLabel } from '../utils/statusLabels';
import styles from './AdminQuotesView.module.css';

type AdminQuotesViewProps = {
  onOpenQuote: (quoteId: string) => void;
};

type StatusFilter = 'ALL' | 'PENDING' | 'COORDINATION' | 'RESOLVED' | 'REJECTED';

const filters: { label: string; value: StatusFilter }[] = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'En coordinación', value: 'COORDINATION' },
  { label: 'Resueltas', value: 'RESOLVED' },
  { label: 'Rechazadas', value: 'REJECTED' },
];

const matchesFilter = (status: QuoteStatus, filter: StatusFilter) => {
  if (filter === 'ALL') return true;
  if (filter === 'PENDING') return status === 'PENDING_REVIEW';
  if (filter === 'COORDINATION') {
    return status === 'IN_COORDINATION'
      || status === 'CONSULTING_PRODUCER'
      || status === 'PROPOSAL_RECEIVED';
  }
  if (filter === 'RESOLVED') {
    return status === 'RESOLUTION_SENT'
      || status === 'ADDED_TO_CART'
      || status === 'PAID'
      || status === 'CONVERTED_TO_ORDER';
  }
  return status === 'REJECTED';
};

export default function AdminQuotesView({ onOpenQuote }: AdminQuotesViewProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadQuotes = async () => {
      try {
        const response = await getImageQuotes();
        if (isMounted) setQuotes(response);
      } catch {
        if (isMounted) setError('No pudimos cargar las cotizaciones.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadQuotes();
    return () => {
      isMounted = false;
    };
  }, []);

  const visibleQuotes = useMemo(
    () => quotes.filter((quote) => matchesFilter(quote.status, filter)),
    [filter, quotes],
  );

  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.heading}>
          <h1>Gestión de cotizaciones</h1>
          <p>Revisa solicitudes, coordina propuestas y envía resoluciones al cliente.</p>
        </div>

        <div className={styles.filters}>
          {filters.map((item) => (
            <button
              className={filter === item.value ? styles.active : undefined}
              type="button"
              key={item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {isLoading && <p>Cargando cotizaciones...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!isLoading && !error && visibleQuotes.length === 0 && (
          <p>No hay cotizaciones para este filtro.</p>
        )}

        <div className={styles.list}>
          {visibleQuotes.map((quote) => (
            <article className={styles.card} key={quote.id}>
              <div className={styles.cardHeader}>
                <div>
                  <h2>{quote.title}</h2>
                  <p>Cliente: {getCustomerDisplayName(quote.customer ?? undefined)}</p>
                </div>
                <span className={styles.status}>{getQuoteStatusLabel(quote.status)}</span>
              </div>
              <div className={styles.facts}>
                <span>Creada: {quote.createdAt}</span>
                <span>{quote.type === 'PRODUCT_BASED' ? 'Producto base' : 'Imagen referencial'}</span>
                <span>Cantidad: {quote.quantity}</span>
              </div>
              <button className="primaryButton" type="button" onClick={() => onOpenQuote(quote.id)}>
                Gestionar
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
