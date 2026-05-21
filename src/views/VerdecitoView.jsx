import ProductCard from '../components/ProductCard/ProductCard.jsx';
import styles from './VerdecitoView.module.css';

const ecoProducts = [
  {
    badge: '🌿 Producto Sostenible',
    image: 'linear-gradient(135deg, #6f8f5d, #dbe7cf)',
    storeName: 'Bancos EcoPeru',
    title: 'Banco de madera recuperada con acabado natural',
    rating: 4.9,
    price: 'S/. 420',
  },
  {
    badge: '🌿 Producto Sostenible',
    image: 'linear-gradient(135deg, #9e7f53, #e9dfc9)',
    storeName: 'Villa Natural',
    title: 'Silla artesanal con fibras naturales reforzadas',
    rating: 4.7,
    price: 'S/. 310',
  },
  {
    badge: '🌿 Producto Sostenible',
    image: 'linear-gradient(135deg, #2e7d32, #ccd9bc)',
    storeName: 'EcoMuebles',
    title: 'Estantería modular fabricada con tableros reciclados',
    rating: 4.8,
    price: 'S/. 680',
  },
  {
    badge: '🌿 Producto Sostenible',
    image: 'linear-gradient(135deg, #b1c28b, #f2ead6)',
    storeName: 'DecoVerde',
    title: 'Set decorativo de pared con piezas reutilizadas',
    rating: 4.6,
    price: 'S/. 190',
  },
];

export default function VerdecitoView() {
  return (
    <main>
      <section className={styles.hero}>
        <div className={`${styles.layout} container`}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>Línea responsable</p>
            <h1>Verdecito <span aria-hidden="true">🌱</span></h1>
            <h2>Línea de Productos Sostenibles</h2>
            <p>
              Una selección de muebles creados con prácticas responsables, materiales recuperados y procesos alineados con los Objetivos de Desarrollo Sostenible (ODS).
            </p>

            <ul className={styles.checkList}>
              <li>Recolección y reutilización de materiales seleccionados.</li>
              <li>Prácticas ecoamigables en talleres locales.</li>
              <li>Etiqueta especial para identificar productos sostenibles.</li>
            </ul>
          </div>

          <div className={styles.illustration} aria-label="Ilustración de trabajo artesanal ecoamigable">
            <div className={styles.circle}>
              <span className={styles.leaf}>🌱</span>
              <span className={styles.handmade}>Hecho local</span>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.catalog} section`}>
        <div className="container">
          <div className="sectionHeader">
            <h2>Revisa tus productos sostenibles <span aria-hidden="true">🌱</span></h2>
          </div>

          <div className={styles.productGrid}>
            {ecoProducts.map((product) => (
              <ProductCard key={`${product.storeName}-${product.title}`} {...product} />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.strip}>
        <div className="container">
          <button type="button">Explorar productos sostenibles</button>
        </div>
      </section>
    </main>
  );
}
