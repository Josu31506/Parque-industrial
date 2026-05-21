import CategoryCard from '../components/CategoryCard/CategoryCard.jsx';
import ProductCard from '../components/ProductCard/ProductCard.jsx';
import { categories, products } from '../data/catalog.js';
import styles from './HomeView.module.css';

const homeHeroImage =
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200';

export default function HomeView({ onProductSelect, onNavigate }) {
  const featuredProducts = products.filter((product) => product.type === 'featured');

  return (
    <main>
      <section
        className={styles.hero}
        style={{
          backgroundImage: `linear-gradient(
            90deg,
            rgba(18, 43, 29, 0.78) 0%,
            rgba(18, 43, 29, 0.58) 42%,
            rgba(18, 43, 29, 0.24) 72%,
            rgba(18, 43, 29, 0.10) 100%
          ), url(${homeHeroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className={`${styles.heroContent} container`}>
          <p className={styles.eyebrow}>Compra local, diseño directo</p>

          <h1>Muebles a medida</h1>

          <p className={styles.heroCopy}>
            Directo del Parque Industrial: encuentra talleres, tiendas y fabricantes
            locales con propuestas listas para transformar tus espacios.
          </p>

          <form
            className={styles.heroSearch}
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              type="search"
              placeholder="Busca salas, comedores, dormitorios..."
              aria-label="Buscar muebles"
            />

            <button className="accentButton" type="submit">
              Buscar
            </button>
          </form>
        </div>
      </section>

      <section className="section" id="categorias">
        <div className="container">
          <div className="sectionHeader">
            <h2>Categorías más populares</h2>
            <a className="sectionLink" href="#todas">
              Ver todas ›
            </a>
          </div>

          <div className={styles.categoryGrid}>
            {categories.map((category) => (
              <CategoryCard key={category.name} {...category} />
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.productsSection} section`} id="destacados">
        <div className="container">
          <div className="sectionHeader">
            <h2>Productos destacados</h2>

            <button
              className="sectionLink"
              type="button"
              onClick={() => onNavigate('verdecito')}
            >
              Ver productos sostenibles ›
            </button>
          </div>

          <div className={styles.productGrid}>
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                onClick={() => onProductSelect(product.id)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.newsletter}>
        <div className={`${styles.newsletterLayout} container`}>
          <div>
            <h2>Conectando talento local</h2>

            <p>
              Recibe novedades, ofertas de talleres y lanzamientos de muebles hechos
              por emprendedores del Parque Industrial.
            </p>
          </div>

          <form
            className={styles.newsletterForm}
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              type="email"
              placeholder="tu.correo@ejemplo.com"
              aria-label="Correo electrónico"
            />

            <button className="accentButton" type="submit">
              Suscribirme
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}