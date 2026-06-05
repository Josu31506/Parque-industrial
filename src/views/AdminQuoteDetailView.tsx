import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { createQuoteResolution, getQuoteById, updateQuoteStatus } from '../services/quotesService';
import type { CreateQuoteResolutionInput, Producer, Quote, QuoteStatus, ViewName } from '../types';
import { getCustomerDisplayName, getProductDisplayName } from '../utils/displayNames';
import { getQuoteStatusLabel } from '../utils/statusLabels';
import styles from './AdminQuoteDetailView.module.css';

type AdminQuoteDetailViewProps = {
  onNavigate: (view: ViewName) => void;
  producers: Producer[];
  quoteId: string | null;
};

const statuses: QuoteStatus[] = [
  'PENDING_REVIEW',
  'IN_COORDINATION',
  'CONSULTING_PRODUCER',
  'PROPOSAL_RECEIVED',
  'RESOLUTION_SENT',
  'REJECTED',
  'EXPIRED',
];

export default function AdminQuoteDetailView({
  onNavigate,
  producers,
  quoteId,
}: AdminQuoteDetailViewProps) {
  const [quote, setQuote] = useState<Quote>();
  const [status, setStatus] = useState<QuoteStatus>('PENDING_REVIEW');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
        if (!isMounted) return;
        setQuote(response);
        setStatus(response.status);
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

  const handleStatusUpdate = async () => {
    if (!quote) return;
    setMessage('');
    setError('');

    try {
      const updated = await updateQuoteStatus(quote.id, status);
      setQuote((current) => current ? { ...current, ...updated, resolutions: current.resolutions } : updated);
      setMessage('Estado actualizado correctamente.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo actualizar el estado.');
    }
  };

  const handleResolution = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!quote) return;

    const formData = new FormData(event.currentTarget);
    const data: CreateQuoteResolutionInput = {
      producerId: String(formData.get('producerId') ?? ''),
      finalTitle: String(formData.get('finalTitle') ?? '').trim(),
      finalDescription: String(formData.get('finalDescription') ?? '').trim(),
      finalPrice: Number(formData.get('finalPrice') ?? 0),
      deliveryTime: String(formData.get('deliveryTime') ?? '').trim(),
      notes: String(formData.get('notes') ?? '').trim() || undefined,
      validUntil: String(formData.get('validUntil') ?? '') || undefined,
    };

    if (!data.producerId || !data.finalTitle || data.finalPrice <= 0) {
      setError('Selecciona una productora, completa el título y usa un precio mayor a 0.');
      return;
    }

    setMessage('');
    setError('');

    try {
      const resolution = await createQuoteResolution(quote.id, data);
      setQuote((current) => current
        ? { ...current, status: 'RESOLUTION_SENT', resolutions: [...current.resolutions, resolution] }
        : current);
      setStatus('RESOLUTION_SENT');
      setMessage('Resolución enviada correctamente.');
      event.currentTarget.reset();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo enviar la resolución.');
    }
  };

  if (isLoading) return <main className={styles.page}><section className="container">Cargando cotización...</section></main>;

  if (!quote) {
    return (
      <main className={styles.page}>
        <section className={`${styles.content} container`}>
          <p className={styles.error}>{error || 'Cotización no encontrada.'}</p>
          <div className={styles.actions}>
            <button className="primaryButton" type="button" onClick={() => onNavigate('adminQuotes')}>
              Volver
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.heading}>
          <h1>Detalle de cotizacion</h1>
          <h2>{quote.title}</h2>
          <p>Cliente: {getCustomerDisplayName(quote.customer ?? undefined)}</p>
        </div>

        <article className={styles.panel}>
          <h2>Solicitud del cliente</h2>
          <p>{quote.description}</p>
          <p>Cantidad: <strong>{quote.quantity}</strong></p>
          <p>Medidas: <strong>{quote.requestedDimensions ?? 'No especificado'}</strong></p>
          <p>Material: <strong>{quote.requestedMaterial ?? 'No especificado'}</strong></p>
          <p>Color: <strong>{quote.requestedColor ?? 'No especificado'}</strong></p>
          <p>Acabado: <strong>{quote.requestedFinish ?? 'No especificado'}</strong></p>
          <p>Distrito: <strong>{quote.deliveryDistrict ?? 'No especificado'}</strong></p>
          <p>Producto base: <strong>{quote.product ? getProductDisplayName(quote.product) : 'No aplica'}</strong></p>
          <p>
            Referencias: <strong>{quote.referenceImages?.join(', ') ?? 'No especificado'}</strong>
          </p>
        </article>

        <article className={styles.panel}>
          <h2>Actualizar estado</h2>
          <div className={styles.actions}>
            <label className={styles.field}>
              <span>Estado</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as QuoteStatus)}>
                {statuses.map((item) => (
                  <option value={item} key={item}>{getQuoteStatusLabel(item)}</option>
                ))}
              </select>
            </label>
            <button className="primaryButton" type="button" onClick={handleStatusUpdate}>
              Guardar estado
            </button>
          </div>
        </article>

        <form className={styles.form} onSubmit={handleResolution}>
          <h2>Enviar resolución</h2>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Productora</span>
              <select name="producerId" required defaultValue="">
                <option value="" disabled>Selecciona una productora</option>
                {producers.map((producer) => (
                  <option value={producer.id} key={producer.id}>{producer.name}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Precio final</span>
              <input name="finalPrice" type="number" min="0.01" step="0.01" required />
            </label>
            <label className={`${styles.field} ${styles.full}`}>
              <span>Título final</span>
              <input name="finalTitle" required />
            </label>
            <label className={`${styles.field} ${styles.full}`}>
              <span>Descripción final</span>
              <textarea name="finalDescription" required />
            </label>
            <label className={styles.field}>
              <span>Tiempo estimado</span>
              <input name="deliveryTime" placeholder="Ej. 15 días hábiles" required />
            </label>
            <label className={styles.field}>
              <span>Válida hasta</span>
              <input name="validUntil" type="date" />
            </label>
            <label className={`${styles.field} ${styles.full}`}>
              <span>Observaciones</span>
              <textarea name="notes" />
            </label>
          </div>

          {message && <p className={styles.success}>{message}</p>}
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button className="primaryButton" type="submit">Enviar resolución</button>
            <button className="accentButton" type="button" onClick={() => onNavigate('adminQuotes')}>
              Volver
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
