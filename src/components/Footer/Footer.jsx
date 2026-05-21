import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.layout} container`}>
        <div className={styles.links}>
          <a href="#politicas">Politicas de privacidad</a>
          <a href="#terminos">Terminos y condiciones</a>
          <a href="#cambios">Cambios y devoluciones</a>
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
