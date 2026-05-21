import ProductCard from '../components/ProductCard/ProductCard.jsx';
import { products } from '../data/catalog.js';
import styles from './VerdecitoView.module.css';

import imagenFondoLocal from '../assets/fondo1.jpeg';
import logoEcoLocal from '../assets/logo.jpeg';

export default function VerdecitoView({ onProductSelect }) {
  const ecoProducts = products.filter((product) => product.type === 'eco');

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
                  <span>Hechos con propósito</span>
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
                comprometidos con un futuro más verde y responsable.
              </p>
            </div>
          </div>

          <div
            className={styles.illustration}
            aria-label="Logo de la línea sostenible Verdecito"
          >
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
            <h2>
              Revisa tus productos sostenibles <span aria-hidden="true"></span>
            </h2>
          </div>

          <div className={styles.productGrid}>
            {ecoProducts.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                onClick={() => onProductSelect(product.id)}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
