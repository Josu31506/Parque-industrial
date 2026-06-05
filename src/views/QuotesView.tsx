import { useEffect, useState } from 'react';
import { getMyQuotes } from '../services/quotesService';
import type { Quote, ViewName } from '../types';
import { getQuoteStatusLabel } from '../utils/statusLabels';
import styles from './QuotesView.module.css';

type QuotesViewProps = {
  onNavigate: (view: ViewName) => void;
  onOpenQuote: (quoteId: string) => void;
  onQuoteByProduct: () => void;
};

export default function QuotesView({ onNavigate, onOpenQuote, onQuoteByProduct }: QuotesViewProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadQuotes = async () => {
      try {
        const response = await getMyQuotes();
        if (isMounted) setQuotes(response);
      } catch {
        if (isMounted) setError('No pudimos cargar tus cotizaciones.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadQuotes();
    return () => {
      isMounted = false;
    };
  }, []);

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
        {error && <p className={styles.error}>{error}</p>}

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
        </div>
      </section>
    </main>
  );
}
