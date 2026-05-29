import type { FormEvent } from 'react';
import styles from './LoginView.module.css';

type LoginViewProps = {
  error?: string;
  onLogin: (event: FormEvent<HTMLFormElement>) => void;
};

export default function LoginView({ error, onLogin }: LoginViewProps) {
  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={onLogin}>
        <div className={styles.cardHeader}>
          <h1>Iniciar sesion</h1>
          <p>Accede para continuar con tu pedido.</p>
        </div>

        <label className={styles.field}>
          <span>Correo</span>
          <input name="email" type="email" placeholder="cliente@demo.com" required />
        </label>

        <label className={styles.field}>
          <span>Contrasena</span>
          <input name="password" type="password" placeholder="Cliente123456" required />
        </label>

        {error && <span className={styles.error}>{error}</span>}

        <button className="primaryButton" type="submit">Iniciar sesion</button>

        <div className={styles.testCredentials}>
          <span>Credenciales de prueba</span>
          <strong>cliente@demo.com / Cliente123456</strong>
          <strong>productor1@demo.com / Productor123456</strong>
          <strong>admin@parqueindustrial.com / Admin123456</strong>
        </div>
      </form>
    </main>
  );
}
