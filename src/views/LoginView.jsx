import styles from './LoginView.module.css';

export default function LoginView({ error, onLogin }) {
  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={onLogin}>
        <p className={styles.logo}>Verdecito</p>
        <h1>Iniciar sesion</h1>
        <p>Accede para continuar con tu compra</p>

        <label>
          Correo
          <input name="email" type="email" placeholder="usuario@verdecito.com" required />
        </label>

        <label>
          Contrasena
          <input name="password" type="password" placeholder="123456" required />
        </label>

        {error && <span className={styles.error}>{error}</span>}

        <button className="primaryButton" type="submit">Iniciar sesion</button>
        <small>Credenciales de prueba: usuario@verdecito.com / 123456</small>
      </form>
    </main>
  );
}
