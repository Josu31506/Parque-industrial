import ProductCard from '../components/ProductCard/ProductCard';
import { products } from '../data/catalog';
import type { Producer } from '../types';
import styles from './ProducerProfileView.module.css';

type ProducerProfileViewProps = {
  producer: Producer | undefined;
  onBack: () => void;
  onOpenCatalog: () => void;
  onProductSelect: (productId: string) => void;
};

export default function ProducerProfileView({
  producer,
  onBack,
  onOpenCatalog,
  onProductSelect,
}: ProducerProfileViewProps) {
  if (!producer) {
    return (
      <main className={styles.page}>
        <section className={`${styles.empty} container`}>
          <h1>Productora no encontrada</h1>
          <button className="primaryButton" type="button" onClick={onOpenCatalog}>
            Volver al catalogo
          </button>
        </section>
      </main>
    );
  }

  const relatedProducts = products.filter((product) => product.producerId === producer.id);

  return (
    <main className={styles.page}>
      <section className={`${styles.profile} container`}>
        <div className={styles.heroCard}>
          <div className={styles.avatar} aria-hidden="true">
            {producer.avatar ?? producer.name.slice(0, 2)}
          </div>

          <div>
            <span className={styles.kicker}>{producer.type}</span>
            <h1>{producer.name}</h1>
            <p className={styles.location}>{producer.location}</p>
            <p className={styles.description}>{producer.description}</p>
            <div className={styles.rating}>★★★★★ <span>4.8 valoracion general</span></div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className="primaryButton" type="button" onClick={onBack}>
            Volver
          </button>
          <button className="accentButton" type="button" onClick={onOpenCatalog}>
            Volver al catalogo
          </button>
        </div>

        <section>
          <div className="sectionHeader">
            <h2>Productos de esta productora</h2>
          </div>

          <div className={styles.productGrid}>
            {relatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                onClick={() => onProductSelect(product.id)}
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
