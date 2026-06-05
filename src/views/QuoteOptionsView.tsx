import type { ViewName } from '../types';
import styles from './QuoteOptionsView.module.css';

type QuoteOptionsViewProps = {
  onNavigate: (view: ViewName) => void;
  onQuoteByProduct: () => void;
  onQuoteByReference: () => void;
};

export default function QuoteOptionsView({
  onNavigate,
  onQuoteByProduct,
  onQuoteByReference,
}: QuoteOptionsViewProps) {
  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.heading}>
          <h1>¿Que deseas cotizar?</h1>
          <p>Elige el punto de partida. Un asesor revisara tu solicitud y coordinara la propuesta con productores locales.</p>
        </div>

        <div className={styles.grid}>
          <article className={styles.card}>
            <h2>Cotizar productos</h2>
            <p>Selecciona un producto del catalogo y personalizalo segun tus medidas, color, material o acabado.</p>
            <button className="primaryButton" type="button" onClick={onQuoteByProduct}>
              Elegir producto para cotizar
            </button>
          </article>

          <article className={styles.card}>
            <h2>Cotizar por imagen o referencia</h2>
            <p>Envia una imagen, enlace o descripcion del mueble que deseas fabricar.</p>
            <button className="accentButton" type="button" onClick={onQuoteByReference}>
              Cotizar con imagen
            </button>
          </article>
        </div>

        <button className={styles.backButton} type="button" onClick={() => onNavigate('quotes')}>
          Volver a mis cotizaciones
        </button>
      </section>
    </main>
  );
}
