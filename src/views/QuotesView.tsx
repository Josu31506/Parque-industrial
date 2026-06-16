import type { Quote, ViewName } from '../types';
import { getQuoteStatusLabel } from '../utils/statusLabels';
import styles from './QuotesView.module.css';

type QuotesViewProps = {
  error?: string;
  isLoading?: boolean;
  onNavigate: (view: ViewName) => void;
  onOpenQuote: (quoteId: string) => void;
  onPageChange?: (page: number) => void;
  onQuoteByProduct: () => void;
  onRefresh?: () => void;
  pageInfo?: { page: number; total: number; totalPages: number };
  quotes: Quote[];
};

export default function QuotesView({
  error = '',
  isLoading = false,
  onNavigate,
  onOpenQuote,
  onPageChange,
  onQuoteByProduct,
  onRefresh,
  pageInfo,
  quotes,
}: QuotesViewProps) {
  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.heading}>
          <h1>Mis cotizaciones</h1>
          <p>Revisa tus solicitudes personalizadas y las propuestas enviadas por nuestros asesores.</p>
          <div className={styles.actions}>
            <button className="primaryButton" type="button" onClick={() => onNavigate('quoteOptions')}>
              Nueva cotización
            </button>
            <button className="accentButton" type="button" onClick={onQuoteByProduct}>
              Cotizar producto
            </button>
          </div>
        </div>

        {isLoading && <p>Cargando cotizaciones...</p>}
        {error && (
          <div className={styles.empty}>
            <p className={styles.error}>{error}</p>
            {onRefresh && (
              <button className="primaryButton" type="button" onClick={onRefresh}>
                Reintentar
              </button>
            )}
          </div>
        )}

        {!isLoading && !error && quotes.length === 0 && (
          <div className={styles.empty}>
            <h2>Aún no tienes cotizaciones</h2>
            <p>Explora productos personalizables y solicita una propuesta a medida.</p>
            <div className={styles.actions}>
              <button className="primaryButton" type="button" onClick={() => onNavigate('quoteOptions')}>
                Crear cotización
              </button>
            </div>
          </div>
        )}

        <div className={styles.list}>
          {quotes.map((quote) => (
            <article className={styles.card} key={quote.id}>
              <div className={styles.cardHeader}>
                <div>
                  <h2>{quote.title}</h2>
                </div>
                <span className={styles.status}>{getQuoteStatusLabel(quote.status)}</span>
              </div>
              <p>{quote.description}</p>
              <div className={styles.facts}>
                <span>Creada: {quote.createdAt}</span>
                <span>Cantidad: {quote.quantity}</span>
                <span>{quote.type === 'PRODUCT_BASED' ? 'Producto base' : 'Referencia visual'}</span>
              </div>
              <div className={styles.actions}>
                <button className="primaryButton" type="button" onClick={() => onOpenQuote(quote.id)}>
                  Ver detalle
                </button>
              </div>
            </article>
          ))}
          {pageInfo && onPageChange && pageInfo.totalPages > 1 && (
            <div className={styles.pagination}>
              <button type="button" disabled={pageInfo.page <= 1} onClick={() => onPageChange(pageInfo.page - 1)}>
                Anterior
              </button>
              <span>Pagina {pageInfo.page} de {pageInfo.totalPages}</span>
              <button type="button" disabled={pageInfo.page >= pageInfo.totalPages} onClick={() => onPageChange(pageInfo.page + 1)}>
                Siguiente
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
