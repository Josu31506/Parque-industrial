import ProductCard from '../components/ProductCard/ProductCard';
import imagenFondoLocal from '../assets/fondo1.jpeg';
import logoEcoLocal from '../assets/logo.jpeg';
import type { Product } from '../types';
import styles from './VerdecitoView.module.css';

type VerdecitoViewProps = {
  catalogError?: string;
  isLoadingCatalog?: boolean;
  onProductSelect: (productId: string) => void;
  onRetryCatalog?: () => void;
  onShowSustainableProducts: () => void;
  products: Product[];
};

const skeletonKeys = ['one', 'two', 'three', 'four'];

function ProductSkeletonGrid() {
  return (
    <div className={styles.productGrid} aria-label="Cargando productos sostenibles">
      {skeletonKeys.map((key) => (
        <article className={styles.skeletonCard} key={key}>
          <span className={styles.skeletonImage} />
          <span className={styles.skeletonLine} />
          <span className={styles.skeletonLineShort} />
          <span className={styles.skeletonButton} />
        </article>
      ))}
    </div>
  );
}

export default function VerdecitoView({
  catalogError,
  isLoadingCatalog,
  onProductSelect,
  onRetryCatalog,
  onShowSustainableProducts,
  products,
}: VerdecitoViewProps) {
  const ecoProducts = products.filter((product) => product?.id && product.type === 'eco');

  return (
    <main className={styles.mainContent}>
      <section
        className={styles.hero}
        style={{
          backgroundImage: `linear-gradient(
            90deg,
            rgba(223, 235, 202, 0.74) 0%,
            rgba(223, 235, 202, 0.50) 38%,
            rgba(223, 235, 202, 0.14) 68%,
            rgba(223, 235, 202, 0.02) 100%
          ), url(${imagenFondoLocal})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className={`${styles.layout} container`}>
          <div className={styles.copy}>
            <div className={styles.textBlock}>
              <h1 className={styles.heroMessage}>
                <span>Productos sostenibles</span>
                <span className={styles.inlineLogoRow}>
                  <span>Hechos con proposito</span>
                  <span
                    className={styles.mobileLogoCircle}
                    style={{ backgroundImage: `url(${logoEcoLocal})` }}
                    aria-hidden="true"
                  />
                </span>
                <span>Pensados para durar</span>
              </h1>

              <div className={styles.divider}></div>

              <p className={styles.description}>
                Apoyamos a los productores locales del Parque Industrial de Villa El Salvador,
                comprometidos con un futuro mas verde y responsable.
              </p>
            </div>
          </div>

          <div className={styles.illustration} aria-label="Logo de la linea sostenible Verdecito">
            <div
              className={styles.logoCircle}
              style={{
                backgroundImage: `url(${logoEcoLocal})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          </div>
        </div>
      </section>

      <section className={`${styles.catalog} section`}>
        <div className="container">
          <div className="sectionHeader">
            <h2>Revisa tus productos sostenibles <span aria-hidden="true"></span></h2>
            <button
              className={styles.catalogButton}
              type="button"
              onClick={onShowSustainableProducts}
            >
              Ver todos los productos sostenibles
            </button>
          </div>

          {isLoadingCatalog && ecoProducts.length === 0 && <ProductSkeletonGrid />}

          {catalogError && (
            <div className={styles.stateCard}>
              <h3>No pudimos cargar Verdecito</h3>
              <p>{catalogError}</p>
              {onRetryCatalog && (
                <button className={styles.catalogButton} type="button" onClick={onRetryCatalog}>
                  Reintentar
                </button>
              )}
            </div>
          )}

          {!isLoadingCatalog && !catalogError && ecoProducts.length === 0 && (
            <div className={styles.stateCard}>
              <h3>No hay productos sostenibles disponibles</h3>
              <p>Estamos preparando nuevas opciones para esta linea.</p>
            </div>
          )}

          {ecoProducts.length > 0 && (
            <div className={styles.productGrid}>
              {ecoProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  onClick={() => onProductSelect(product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
