import type { ChangeEvent, FormEvent } from 'react';
import logo2 from '../../assets/logo2.jpeg';
import type { Role, User, ViewName } from '../../types';
import styles from './Navbar.module.css';

type NavItem =
  | { label: string; view: ViewName; anchor?: never }
  | { label: string; anchor: string; view?: never };

type NavbarProps = {
  activeView?: ViewName;
  cartCount?: number;
  currentRole: Role;
  currentUser: User | null;
  notificationCount?: number;
  onNavigate: (view: ViewName) => void;
  onRoleChange: (role: Role) => void;
};

const customerNav: NavItem[] = [
  { label: 'Inicio', view: 'home' },
  { label: 'Catalogo', view: 'catalog' },
  { label: 'Verdecito', view: 'verdecito' },
  { label: 'Carrito', view: 'cart' },
  { label: 'Pedidos', view: 'orders' },
  { label: 'Solicitudes', view: 'purchaseRequests' },
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
  { label: 'Reclamos', view: 'claims' },
  { label: 'Notificaciones', view: 'notifications' },
];

const getNavItems = (role: Role) => {
  if (role === 'seller') return sellerNav;
  if (role === 'admin') return adminNav;
  return customerNav;
};

export default function Navbar({
  activeView = 'home',
  cartCount = 0,
  currentRole,
  currentUser,
  notificationCount = 0,
  onNavigate,
  onRoleChange,
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

  const handleRoleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onRoleChange(event.target.value as Role);
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
          {getNavItems(currentRole).map((item) => (
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
          

          <label className={styles.roleSelect}>
            <span>Rol</span>
            <select value={currentRole} onChange={handleRoleChange}>
              <option value="customer">Cliente</option>
              <option value="seller">Productor</option>
              <option value="admin">Admin/Asesor</option>
            </select>
          </label>

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
