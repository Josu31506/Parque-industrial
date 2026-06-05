import type { FormEvent } from 'react';
import { useState } from 'react';
import { createQuote } from '../services/quotesService';
import type { Product, QuoteType, ViewName } from '../types';
import { getCategoryDisplayName, getProducerDisplayName } from '../utils/displayNames';
import styles from './QuoteRequestView.module.css';

type QuoteRequestViewProps = {
  additionalProductTitles?: string[];
  onNavigate: (view: ViewName) => void;
  onQuoteCreated: () => void;
  product?: Product;
  quoteType: QuoteType;
};

export default function QuoteRequestView({
  additionalProductTitles = [],
  onNavigate,
  onQuoteCreated,
  product,
  quoteType,
}: QuoteRequestViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const additionalProductsText = additionalProductTitles.length
    ? ` Productos adicionales del carrito: ${additionalProductTitles.join(', ')}.`
    : '';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get('title') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const quantity = Number(formData.get('quantity') ?? 1);
    const deliveryDistrict = String(formData.get('deliveryDistrict') ?? '').trim();
    const referenceImages = String(formData.get('referenceImages') ?? '')
      .split(/[,\n]/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (!title || !description || !deliveryDistrict || quantity < 1 || (quoteType === 'PRODUCT_BASED' && !product?.id)) {
      setError('Completa los campos obligatorios.');
      setIsSubmitting(false);
      return;
    }

    try {
      await createQuote({
        type: quoteType,
        productId: product?.id,
        title,
        description,
        quantity,
        requestedDimensions: String(formData.get('requestedDimensions') ?? '') || undefined,
        requestedMaterial: String(formData.get('requestedMaterial') ?? '') || undefined,
        requestedColor: String(formData.get('requestedColor') ?? '') || undefined,
        requestedFinish: String(formData.get('requestedFinish') ?? '') || undefined,
        deliveryDistrict,
        referenceImages: referenceImages.length ? referenceImages : undefined,
      });
      setMessage('Cotización enviada correctamente. Un asesor revisará tu solicitud.');
      window.setTimeout(onQuoteCreated, 700);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo enviar la cotización.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={`${styles.layout} container`}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.heading}>
            <h1>Solicitar cotización</h1>
            <p>Cuéntanos qué necesitas. Un asesor coordinará la propuesta con productores locales.</p>
          </div>

          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Título de la solicitud</span>
              <input name="title" defaultValue={product?.title ?? ''} required />
            </label>
            <label className={styles.field}>
              <span>Cantidad</span>
              <input name="quantity" type="number" min="1" defaultValue="1" required />
            </label>
            <label className={`${styles.field} ${styles.full}`}>
              <span>Comentario adicional</span>
              <textarea
                name="description"
                defaultValue={product ? `Deseo cotizar una versión personalizada de ${product.title}.${additionalProductsText}` : ''}
                required
              />
            </label>
            <label className={styles.field}>
              <span>Medidas deseadas</span>
              <input name="requestedDimensions" placeholder="Ej. 180 x 90 x 76 cm" />
            </label>
            <label className={styles.field}>
              <span>Material deseado</span>
              <input name="requestedMaterial" placeholder="Ej. madera recuperada" />
            </label>
            <label className={styles.field}>
              <span>Color deseado</span>
              <input name="requestedColor" placeholder="Ej. nogal claro" />
            </label>
            <label className={styles.field}>
              <span>Acabado deseado</span>
              <input name="requestedFinish" placeholder="Ej. mate" />
            </label>
            <label className={styles.field}>
              <span>Distrito de entrega</span>
              <input name="deliveryDistrict" placeholder="Ej. Villa El Salvador" />
            </label>
            <label className={styles.field}>
              <span>Imágenes referenciales (URLs opcionales)</span>
              <textarea
                name="referenceImages"
                placeholder="Pega una o varias URLs separadas por coma o salto de línea"
              />
            </label>
          </div>

          {message && <p className={styles.success}>{message}</p>}
          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button className="primaryButton" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar cotización'}
            </button>
            <button className="accentButton" type="button" onClick={() => onNavigate('catalog')}>
              Cancelar
            </button>
          </div>
        </form>

        <aside className={styles.summary}>
          <h2>Producto base</h2>
          {product ? (
            <>
              <div className={styles.productImage} style={{ backgroundImage: `url(${product.image})` }} />
              <strong>{product.title}</strong>
              <p>{getProducerDisplayName({ name: product.storeName })}</p>
              <p>{getCategoryDisplayName(undefined, product.category)}</p>
              <p>{product.price}</p>
              <p>{product.description}</p>
              {additionalProductTitles.length > 0 && (
                <p>Productos adicionales: {additionalProductTitles.join(', ')}</p>
              )}
            </>
          ) : (
            <p>Solicitud basada en una referencia proporcionada por el cliente.</p>
          )}
        </aside>
      </section>
    </main>
  );
}
