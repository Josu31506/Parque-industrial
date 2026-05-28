import type { FormEvent } from 'react';
import logo2 from '../../assets/logo2.jpeg';
import type { User, ViewName } from '../../types';
import styles from './Navbar.module.css';

type NavItem =
  | { label: string; view: ViewName; anchor?: never }
  | { label: string; anchor: string; view?: never };

type NavbarProps = {
  activeView?: ViewName;
  cartCount?: number;
  currentUser: User | null;
  onNavigate: (view: ViewName) => void;
};

const navItems: NavItem[] = [
  { label: 'Inicio', view: 'home' },
  { label: 'Categorias', anchor: 'categorias' },
  { label: 'Destacados', anchor: 'destacados' },
  { label: 'Verdecito', view: 'verdecito' },
  { label: 'Carrito', view: 'cart' },
  { label: 'Pedidos', view: 'orders' },
];

export default function Navbar({
  activeView = 'home',
  cartCount = 0,
  currentUser,
  onNavigate,
}: NavbarProps) {
  const handleNavClick = (item: NavItem) => {
    if (item.view) {
      onNavigate(item.view);
      return;
    }

    if (activeView !== 'home') {
      onNavigate('home');
      requestAnimationFrame(() => {
        document.getElementById(item.anchor)?.scrollIntoView({ behavior: 'smooth' });
      });
      return;
    }

    document.getElementById(item.anchor)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <header className={styles.header}>
      <nav className={`${styles.navbar} container`} aria-label="Navegacion principal">
        <button
          className={styles.logoButton}
          type="button"
          onClick={() => onNavigate('home')}
          aria-label="Ir al inicio"
        >
          <img src={logo2} alt="Parque Industrial Conecta" className={styles.logoImage} />
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
          <form className={styles.search} role="search" onSubmit={handleSearchSubmit}>
            <input type="search" placeholder="Buscar" aria-label="Buscar productos" />
          </form>

          <button
            className="primaryButton"
            type="button"
            onClick={() => onNavigate(currentUser ? 'orders' : 'login')}
          >
            {currentUser ? 'Mi cuenta' : 'Ingresar'}
          </button>
        </div>
      </nav>
    </header>
  );
}
