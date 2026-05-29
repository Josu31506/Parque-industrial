import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import CategoryCard from '../components/CategoryCard/CategoryCard';
import ProductCard from '../components/ProductCard/ProductCard';
import type { Category, Product, ViewName } from '../types';
import styles from './HomeView.module.css';

type HomeViewProps = {
  catalogError?: string;
  categories: Category[];
  isLoadingCatalog?: boolean;
  onCategorySelect: (categoryName: string) => void;
  onOpenCatalog: () => void;
  onProductSelect: (productId: string) => void;
  onNavigate: (view: ViewName) => void;
  onShowSustainableProducts: () => void;
  products: Product[];
};

type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  backgroundImage: string;
  overlay: string;
  showSearch?: boolean;
  centerActions?: boolean;
  primaryLabel: string;
  secondaryLabel?: string;
  primaryAction: () => void;
  secondaryAction?: () => void;
};

const homeHeroImage =
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200';
  
const quoteHeroImage =
  'https://conkansei.com/wp-content/uploads/2020/12/proyecto-bricolaje.jpg';

const verdecitoHeroImage =
  'https://miroytengo.es/blog/wp-content/uploads/2-24.jpg';

export default function HomeView({
  catalogError,
  categories,
  isLoadingCatalog,
  onCategorySelect,
  onOpenCatalog,
  onProductSelect,
  onNavigate,
  onShowSustainableProducts,
  products,
}: HomeViewProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [carouselCycle, setCarouselCycle] = useState(0);
  const [quoteMessage, setQuoteMessage] = useState('');

  const heroSlides: HeroSlide[] = useMemo(() => [
    {
      id: 'catalog',
      eyebrow: 'Compra local, diseño directo',
      title: 'Encuentra tu mueble ideal',
      description:
        'Directo del Parque Industrial: descubre talleres, tiendas y fabricantes locales con propuestas listas para transformar tus espacios.',
      backgroundImage: homeHeroImage,
      overlay: `linear-gradient(
        90deg,
        rgba(9, 28, 58, 0.84) 0%,
        rgba(9, 28, 58, 0.68) 42%,
        rgba(9, 28, 58, 0.34) 72%,
        rgba(9, 28, 58, 0.12) 100%
      )`,
      showSearch: true,
      centerActions: true,
      primaryLabel: 'Ver catálogo',
      primaryAction: onOpenCatalog,
    },
    {
      id: 'quote',
      eyebrow: 'Cotizaciones personalizadas',
      title: 'Diseña el mueble que necesitas',
      description:
        'Solicita muebles a medida, modifica dimensiones, elige colores o envía una referencia para recibir una propuesta personalizada.',
      backgroundImage: quoteHeroImage,
      overlay: `linear-gradient(
        90deg,
        rgba(9, 28, 58, 0.90) 0%,
        rgba(9, 28, 58, 0.74) 46%,
        rgba(9, 28, 58, 0.42) 76%,
        rgba(9, 28, 58, 0.18) 100%
      )`,
      primaryLabel: 'Solicitar cotización',
      secondaryLabel: 'Ver productos',
      primaryAction: () => setQuoteMessage('Este flujo será gestionado por un asesor en una siguiente fase.'),
      secondaryAction: onOpenCatalog,
    },
    {
      id: 'verdecito',
      eyebrow: 'Línea sostenible',
      title: 'Verdecito',
      description:
        'Descubre productos sostenibles, hechos con propósito y pensados para durar.',
      backgroundImage: verdecitoHeroImage,
      overlay: `linear-gradient(
        90deg,
        rgba(9, 28, 58, 0.82) 0%,
        rgba(15, 74, 37, 0.66) 44%,
        rgba(15, 74, 37, 0.34) 74%,
        rgba(15, 74, 37, 0.12) 100%
      )`,
      primaryLabel: 'Ver sostenibles',
      secondaryLabel: 'Conoce Verdecito',
      primaryAction: onShowSustainableProducts,
      secondaryAction: () => onNavigate('verdecito'),
    },
  ], [onNavigate, onOpenCatalog, onShowSustainableProducts]);

  const slide = heroSlides[activeSlide];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % heroSlides.length);
      setQuoteMessage('');
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [heroSlides.length, carouselCycle]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const resetCarouselTimer = () => {
    setQuoteMessage('');
    setCarouselCycle((currentCycle) => currentCycle + 1);
  };

  const goToSlide = (index: number) => {
    setActiveSlide(index);
    resetCarouselTimer();
  };

  const goToPreviousSlide = () => {
    setActiveSlide((currentSlide) => (
      currentSlide === 0 ? heroSlides.length - 1 : currentSlide - 1
    ));
    resetCarouselTimer();
  };

  const goToNextSlide = () => {
    setActiveSlide((currentSlide) => (currentSlide + 1) % heroSlides.length);
    resetCarouselTimer();
  };

  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.heroBackdrop} aria-hidden="true">
          {heroSlides.map((item, index) => (
            <div
              className={`${styles.heroSlide} ${index === activeSlide ? styles.activeSlide : ''}`}
              style={{
                backgroundImage: `${item.overlay}, url(${item.backgroundImage})`,
              }}
              key={item.id}
            />
          ))}
        </div>

        <button
          className={`${styles.carouselButton} ${styles.prevButton}`}
          type="button"
          onClick={goToPreviousSlide}
          aria-label="Slide anterior"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15.5 5L8.5 12L15.5 19" />
          </svg>
        </button>

        <div className={`${styles.heroContent} container`} key={slide.id}>
          <p className={styles.eyebrow}>{slide.eyebrow}</p>
          <h1>{slide.title}</h1>
          <p className={styles.heroCopy}>{slide.description}</p>

          {slide.showSearch && (
            <form className={styles.heroSearch} role="search" onSubmit={handleSubmit}>
              <input
                type="search"
                placeholder="Busca salas, comedores, dormitorios..."
                aria-label="Buscar muebles"
              />
              <button className="accentButton" type="submit">Buscar</button>
            </form>
          )}

          <div className={`${styles.heroActions} ${slide.centerActions ? styles.centerActions : ''}`}>
          <button className="primaryButton" type="button" onClick={slide.primaryAction}>
            {slide.primaryLabel}
          </button>

          {slide.secondaryLabel && slide.secondaryAction && (
            <button className="accentButton" type="button" onClick={slide.secondaryAction}>
              {slide.secondaryLabel}
            </button>
          )}
        </div>

          {quoteMessage && <p className={styles.heroNotice}>{quoteMessage}</p>}

          <div className={styles.carouselDots} aria-label="Seleccionar slide">
            {heroSlides.map((item, index) => (
              <button
                className={index === activeSlide ? styles.activeDot : undefined}
                type="button"
                key={item.id}
                onClick={() => goToSlide(index)}
                aria-label={`Ver slide ${index + 1}: ${item.title}`}
              />
            ))}
          </div>
        </div>

        <button
          className={`${styles.carouselButton} ${styles.nextButton}`}
          type="button"
          onClick={goToNextSlide}
          aria-label="Siguiente slide"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8.5 5L15.5 12L8.5 19" />
          </svg>
        </button>
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

          {isLoadingCatalog && <p>Cargando productos...</p>}
          {catalogError && <p>{catalogError}</p>}

          {!isLoadingCatalog && (
            <div className={styles.productGrid}>
              {products.map((product) => (
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
