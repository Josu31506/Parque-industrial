import { useEffect, useState } from 'react';
import { addQuoteToCart, getQuoteById } from '../services/quotesService';
import type { Quote, ViewName } from '../types';
import { getProducerDisplayName, getProductDisplayName } from '../utils/displayNames';
import { getQuoteStatusLabel } from '../utils/statusLabels';
import styles from './QuoteDetailView.module.css';

type QuoteDetailViewProps = {
  onNavigate: (view: ViewName) => void;
  quoteId: string | null;
};

const money = (value: number) => `S/. ${value.toLocaleString('es-PE')}`;

export default function QuoteDetailView({ onNavigate, quoteId }: QuoteDetailViewProps) {
  const [quote, setQuote] = useState<Quote>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadQuote = async () => {
      if (!quoteId) {
        setError('Cotización no encontrada.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await getQuoteById(quoteId);
        if (isMounted) setQuote(response);
      } catch {
        if (isMounted) setError('No pudimos cargar la cotización.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadQuote();
    return () => {
      isMounted = false;
    };
  }, [quoteId]);

  const handleAddToCart = async () => {
    if (!quote) return;
    setIsAdding(true);
    setError('');

    try {
      await addQuoteToCart(quote.id);
      onNavigate('cart');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo agregar la cotización al carrito.');
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) return <main className={styles.page}><section className="container">Cargando cotización...</section></main>;

  if (!quote || error) {
    return (
      <main className={styles.page}>
        <section className={`${styles.content} container`}>
          <p className={styles.error}>{error || 'Cotización no encontrada.'}</p>
          <div className={styles.actions}>
            <button className="primaryButton" type="button" onClick={() => onNavigate('quotes')}>
              Volver a mis cotizaciones
            </button>
          </div>
        </section>
      </main>
    );
  }

  const resolution = quote.resolutions[quote.resolutions.length - 1];

  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.heading}>
          <h1>Detalle de cotizacion</h1>
          <h2>{quote.title}</h2>
          <p>{quote.description}</p>
          <span className={styles.status}>{getQuoteStatusLabel(quote.status)}</span>
        </div>

        <article className={styles.panel}>
          <h2>Datos solicitados</h2>
          <div className={styles.facts}>
            <div><span>Cantidad</span><strong>{quote.quantity}</strong></div>
            <div><span>Medidas</span><strong>{quote.requestedDimensions ?? 'No especificado'}</strong></div>
            <div><span>Material</span><strong>{quote.requestedMaterial ?? 'No especificado'}</strong></div>
            <div><span>Color</span><strong>{quote.requestedColor ?? 'No especificado'}</strong></div>
            <div><span>Acabado</span><strong>{quote.requestedFinish ?? 'No especificado'}</strong></div>
            <div><span>Entrega</span><strong>{quote.deliveryDistrict ?? 'No especificado'}</strong></div>
            <div><span>Producto base</span><strong>{quote.product ? getProductDisplayName(quote.product) : 'No aplica'}</strong></div>
            <div><span>Referencia</span><strong>{quote.referenceImages?.join(', ') ?? 'No especificado'}</strong></div>
          </div>
        </article>

        {resolution ? (
          <article className={styles.resolution}>
            <h2>{resolution.finalTitle}</h2>
            <p>{resolution.finalDescription}</p>
            <strong className={styles.price}>{money(resolution.finalPrice)}</strong>
            <div className={styles.facts}>
              <div><span>Productora asignada</span><strong>{getProducerDisplayName(resolution.producer ?? undefined)}</strong></div>
              <div><span>Tiempo estimado</span><strong>{resolution.deliveryTime}</strong></div>
              <div><span>Validez</span><strong>{resolution.validUntil ?? 'No especificado'}</strong></div>
            </div>
            {resolution.notes && <p>{resolution.notes}</p>}
            <div className={styles.actions}>
              <button className="primaryButton" type="button" disabled={isAdding} onClick={handleAddToCart}>
                {isAdding ? 'Agregando...' : 'Agregar al carrito'}
              </button>
            </div>
          </article>
        ) : (
          <article className={styles.panel}>
            <h2>Solicitud en evaluación</h2>
            <p>Tu cotización está siendo evaluada por un asesor.</p>
          </article>
        )}

        <div className={styles.actions}>
          <button className="accentButton" type="button" onClick={() => onNavigate('quotes')}>
            Volver a mis cotizaciones
          </button>
        </div>
      </section>
    </main>
  );
}
