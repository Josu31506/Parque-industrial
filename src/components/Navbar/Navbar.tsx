import logo2 from '../../assets/logo2.jpeg';
import type { ApiRole, User, ViewName } from '../../types';
import styles from './Navbar.module.css';

type NavItem =
  | { label: string; view: ViewName; anchor?: never }
  | { label: string; anchor: string; view?: never };

type NavbarProps = {
  activeView?: ViewName;
  cartCount?: number;
  currentUser: User | null;
  notificationCount?: number;
  onNavigate: (view: ViewName) => void;
  onLogout?: () => void;
};

const publicNav: NavItem[] = [
  { label: 'Inicio', view: 'home' },
  { label: 'Catalogo', view: 'catalog' },
  { label: 'Verdecito', view: 'verdecito' },
];

const customerNav: NavItem[] = [
  { label: 'Inicio', view: 'home' },
  { label: 'Catalogo', view: 'catalog' },
  { label: 'Verdecito', view: 'verdecito' },
  { label: 'Carrito', view: 'cart' },
  { label: 'Pedidos', view: 'orders' },
  { label: 'Solicitudes', view: 'purchaseRequests' },
  { label: 'Cotizaciones', view: 'quotes' },
  { label: 'Notificaciones', view: 'notifications' },
];

const sellerNav: NavItem[] = [
  { label: 'Inicio', view: 'home' },
  { label: 'Catalogo', view: 'catalog' },
  { label: 'Panel productor', view: 'sellerDashboard' },
  { label: 'Notificaciones', view: 'notifications' },
];

const adminNav: NavItem[] = [
  { label: 'Inicio', view: 'home' },
  { label: 'Catalogo', view: 'catalog' },
  { label: 'Reclamos', view: 'claims' },
  { label: 'Gestion de usuarios', view: 'userManagement' },
  { label: 'Gestion de cotizaciones', view: 'adminQuotes' },
  { label: 'Notificaciones', view: 'notifications' },
];

const advisorNav: NavItem[] = [
  { label: 'Inicio', view: 'home' },
  { label: 'Catalogo', view: 'catalog' },
  { label: 'Reclamos', view: 'claims' },
  { label: 'Gestion de cotizaciones', view: 'adminQuotes' },
  { label: 'Notificaciones', view: 'notifications' },
];

const getNavItems = (role: ApiRole | undefined) => {
  if (!role) return publicNav;
  if (role === 'SELLER') return sellerNav;
  if (role === 'ADMIN') return adminNav;
  if (role === 'ADVISOR') return advisorNav;
  return customerNav;
};

export default function Navbar({
  activeView = 'home',
  cartCount = 0,
  currentUser,
  notificationCount = 0,
  onNavigate,
  onLogout,
}: NavbarProps) {
  const navItems = getNavItems(currentUser?.role);
  const accountView: ViewName = currentUser?.role === 'CLIENT' ? 'orders' : 'notifications';

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
                {item.view === 'notifications' && notificationCount > 0 ? <span>{notificationCount}</span> : null}
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <button
            className="primaryButton"
            type="button"
            onClick={() => onNavigate(currentUser ? accountView : 'login')}
          >
            {currentUser ? currentUser.name || 'Mi cuenta' : 'Ingresar'}
          </button>

          {currentUser && onLogout && (
            <button className="accentButton" type="button" onClick={onLogout}>
              Salir
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
