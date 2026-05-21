import styles from './Navbar.module.css';

const navItems = [
  { label: 'Inicio', view: 'home' },
  { label: 'Categorías', anchor: 'categorias' },
  { label: 'Destacados', anchor: 'destacados' },
  { label: 'Tiendas', anchor: 'tiendas' },
  { label: 'Verdecito', view: 'verdecito' },
  { label: 'Nosotros', anchor: 'nosotros' },
];

export default function Navbar({ activeView = 'home', onNavigate }) {
  const handleNavClick = (item) => {
    if (item.view) {
      onNavigate?.(item.view);
      return;
    }

    if (activeView !== 'home') {
      onNavigate?.('home');
      requestAnimationFrame(() => {
        document.getElementById(item.anchor)?.scrollIntoView({ behavior: 'smooth' });
      });
      return;
    }

    document.getElementById(item.anchor)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className={styles.header}>
      <nav className={`${styles.navbar} container`} aria-label="Navegación principal">
        <button className={styles.logo} type="button" onClick={() => onNavigate?.('home')}>
          Parque Industrial conecta.
        </button>

        <ul className={styles.menu}>
          {navItems.map((item) => (
            <li key={item.label}>
              <button
                className={item.view === activeView ? styles.active : undefined}
                type="button"
                onClick={() => handleNavClick(item)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <form className={styles.search} role="search" onSubmit={(event) => event.preventDefault()}>
            <input type="search" placeholder="Buscar" aria-label="Buscar productos" />
          </form>
          <button className="primaryButton" type="button">Ingresar</button>
        </div>
      </nav>
    </header>
  );
}
