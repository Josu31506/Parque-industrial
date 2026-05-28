import type { ViewName } from '../../types';
import styles from './Footer.module.css';

type FooterProps = {
  onNavigate: (view: ViewName) => void;
};

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.layout} container`}>
        <div className={styles.links}>
          <a href="#politicas">Politicas de privacidad</a>
          <a href="#terminos">Terminos y condiciones</a>
          <button type="button" onClick={() => onNavigate('support')}>
            Atencion al cliente
          </button>
        </div>

        <div className={styles.contact}>
          <span>Villa El Salvador</span>
          <span>+51 987 654 321</span>
          <span>soporte@parqueindustrial.pe</span>
          <div className={styles.payments} aria-label="Pasarelas de pago">
            <span>Visa</span>
            <span>BCP</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
