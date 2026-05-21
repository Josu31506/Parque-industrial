import styles from './LoginView.module.css';

export default function LoginView({ error, onLogin }) {
  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={onLogin}>
        <div className={styles.cardHeader}>
          <h1>Iniciar sesión</h1>
          <p>Accede para continuar con tu pedido.</p>
        </div>

        <label className={styles.field}>
          <span>Correo</span>
          <input
            name="email"
            type="email"
            placeholder="usuario@verdecito.com"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Contraseña</span>
          <input
            name="password"
            type="password"
            placeholder="123456"
            required
          />
        </label>

        {error && <span className={styles.error}>{error}</span>}

        <button className="primaryButton" type="submit">
          Iniciar sesión
        </button>

        <div className={styles.testCredentials}>
          <span>Credenciales de prueba</span>
          <strong>usuario@verdecito.com</strong>
          <strong>123456</strong>
        </div>
      </form>
    </main>
  );
}