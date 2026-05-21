import CategoryCard from '../components/CategoryCard/CategoryCard.jsx';
import ProductCard from '../components/ProductCard/ProductCard.jsx';
import styles from './HomeView.module.css';

const categories = [
  { name: 'Comedores', rating: 4.8, reviews: 126, image: 'linear-gradient(135deg, #b7835a, #ead8c2)' },
  { name: 'Salas', rating: 4.9, reviews: 214, image: 'linear-gradient(135deg, #8296a8, #ead8c2)' },
  { name: 'Dormitorios', rating: 4.7, reviews: 98, image: 'linear-gradient(135deg, #9b8a7a, #f3d8c8)' },
  { name: 'Oficinas', rating: 4.8, reviews: 83, image: 'linear-gradient(135deg, #0f2c59, #d7dee7)' },
  { name: 'Decoración', rating: 4.6, reviews: 75, image: 'linear-gradient(135deg, #e59866, #f7eee8)' },
];

const featuredProducts = [
  {
    badge: 'Nuevo',
    image: 'linear-gradient(135deg, #7f8b93, #e5ded8)',
    storeName: 'Muebles Ríos',
    title: 'Sofá modular en lino gris con base de madera',
    rating: 4.9,
    price: 'S/. 1,890',
  },
  {
    badge: 'Oferta',
    image: 'linear-gradient(135deg, #966b45, #ead5bd)',
    storeName: 'Taller Norte',
    title: 'Mesa de comedor extensible para seis personas',
    rating: 4.7,
    price: 'S/. 1,250',
    oldPrice: 'S/. 1,480',
  },
  {
    badge: 'Nuevo',
    image: 'linear-gradient(135deg, #8d8177, #f0ded5)',
    storeName: 'Dormitorios Alba',
    title: 'Cama queen tapizada con cabecera acolchada',
    rating: 4.8,
    price: 'S/. 2,150',
  },
  {
    badge: 'Oferta',
    image: 'linear-gradient(135deg, #0f2c59, #c9d4df)',
    storeName: 'Línea Oficina Pro',
    title: 'Escritorio ejecutivo compacto con repisas laterales',
    rating: 4.6,
    price: 'S/. 760',
    oldPrice: 'S/. 920',
  },
];

export default function HomeView() {
  return (
    <main>
      <section className={styles.hero}>
        <div className={`${styles.heroContent} container`}>
          <p className={styles.eyebrow}>Compra local, diseño directo</p>
          <h1>Muebles A Medida</h1>
          <p className={styles.heroCopy}>
            Directo del Parque Industrial: encuentra talleres, tiendas y fabricantes locales con propuestas listas para transformar tus espacios.
          </p>

          <form className={styles.heroSearch} role="search" onSubmit={(event) => event.preventDefault()}>
            <input type="search" placeholder="Busca salas, comedores, dormitorios..." aria-label="Buscar muebles" />
            <button className="accentButton" type="submit">Buscar</button>
          </form>
        </div>
      </section>

      <section className="section" id="categorias">
        <div className="container">
          <div className="sectionHeader">
            <h2>Categorías Más Populares</h2>
            <a className="sectionLink" href="#todas">Ver todas ›</a>
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
            <h2>Productos Destacados</h2>
            <a className="sectionLink" href="#productos">Ver todos ›</a>
          </div>

          <div className={styles.productGrid}>
            {featuredProducts.map((product) => (
              <ProductCard key={`${product.storeName}-${product.title}`} {...product} />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.newsletter}>
        <div className={`${styles.newsletterLayout} container`}>
          <div>
            <h2>Conectando Talento Local</h2>
            <p>Recibe novedades, ofertas de talleres y lanzamientos de muebles hechos por emprendedores del Parque Industrial.</p>
          </div>
          <form className={styles.newsletterForm} onSubmit={(event) => event.preventDefault()}>
            <input type="email" placeholder="tu.correo@ejemplo.com" aria-label="Correo electrónico" />
            <button className="accentButton" type="submit">Suscribirme</button>
          </form>
        </div>
      </section>
    </main>
  );
}
