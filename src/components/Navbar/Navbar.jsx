import styles from './Navbar.module.css';

const navItems = [
  { label: 'Inicio', view: 'home' },
  { label: 'Categorias', anchor: 'categorias' },
  { label: 'Destacados', anchor: 'destacados' },
  { label: 'Tiendas', anchor: 'tiendas' },
  { label: 'Verdecito', view: 'verdecito' },
  { label: 'Carrito', view: 'cart' },
  { label: 'Pedidos', view: 'orders' },
  { label: 'Nosotros', anchor: 'nosotros' },
];

export default function Navbar({ activeView = 'home', cartCount = 0, currentUser, onNavigate }) {
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
      <nav className={`${styles.navbar} container`} aria-label="Navegacion principal">
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
                {item.view === 'cart' && cartCount > 0 ? <span>{cartCount}</span> : null}
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <form className={styles.search} role="search" onSubmit={(event) => event.preventDefault()}>
            <input type="search" placeholder="Buscar" aria-label="Buscar productos" />
          </form>
          <button className="primaryButton" type="button" onClick={() => onNavigate?.(currentUser ? 'orders' : 'login')}>
            {currentUser ? 'Mi cuenta' : 'Ingresar'}
          </button>
        </div>
      </nav>
    </header>
  );
}
