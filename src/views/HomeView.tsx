import type { FormEvent } from 'react';
import CategoryCard from '../components/CategoryCard/CategoryCard';
import ProductCard from '../components/ProductCard/ProductCard';
import { categories, products } from '../data/catalog';
import type { ViewName } from '../types';
import styles from './HomeView.module.css';

type HomeViewProps = {
  onCategorySelect: (categoryName: string) => void;
  onOpenCatalog: () => void;
  onProductSelect: (productId: string) => void;
  onNavigate: (view: ViewName) => void;
};

const homeHeroImage =
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200';

export default function HomeView({
  onCategorySelect,
  onOpenCatalog,
  onProductSelect,
  onNavigate,
}: HomeViewProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

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

          <form className={styles.heroSearch} role="search" onSubmit={handleSubmit}>
            <input
              type="search"
              placeholder="Busca salas, comedores, dormitorios..."
              aria-label="Buscar muebles"
            />
            <button className="accentButton" type="submit">Buscar</button>
          </form>

          <div className={styles.heroActions}>
            <button className="primaryButton" type="button" onClick={onOpenCatalog}>
              Ver catalogo
            </button>
            <button className="accentButton" type="button" onClick={() => onNavigate('verdecito')}>
              Explorar Verdecito
            </button>
          </div>
        </div>
      </section>

      <section className="section" id="categorias">
        <div className="container">
          <div className="sectionHeader">
            <h2>Categorias mas populares</h2>
            <button className="sectionLink" type="button" onClick={onOpenCatalog}>
              Ver todas ›
            </button>
          </div>

          <div className={styles.categoryGrid}>
            {categories.map((category) => (
              <CategoryCard
                key={category.name}
                {...category}
                onClick={() => onCategorySelect(category.name)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.productsSection} section`} id="destacados">
        <div className="container">
          <div className="sectionHeader">
            <h2>Explora nuestros productos</h2>
            <button className="sectionLink" type="button" onClick={onOpenCatalog}>
              Ver catalogo completo ›
            </button>
          </div>

          <div className={styles.productGrid}>
            {products.map((product) => (
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

          <form className={styles.newsletterForm} onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="tu.correo@ejemplo.com"
              aria-label="Correo electronico"
            />
            <button className="accentButton" type="submit">Suscribirme</button>
          </form>
        </div>
      </section>
    </main>
  );
}
