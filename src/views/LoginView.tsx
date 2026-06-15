import type { FormEvent } from 'react';
import { useState } from 'react';
import styles from './LoginView.module.css';

type LoginViewProps = {
  error?: string;
  onLogin: (event: FormEvent<HTMLFormElement>) => void;
  onRegister: (event: FormEvent<HTMLFormElement>) => void;
};

type AuthMode = 'login' | 'register';
type AccountType = 'CLIENT' | 'SELLER';

export default function LoginView({ error, onLogin, onRegister }: LoginViewProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [accountType, setAccountType] = useState<AccountType>('CLIENT');

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h1>{mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}</h1>
          <p>{mode === 'login' ? 'Accede para continuar con tu pedido.' : 'Registra tus datos para usar Parque Industrial Conecta.'}</p>
        </div>

        <div className={styles.modeTabs}>
          <button className={mode === 'login' ? styles.active : undefined} type="button" onClick={() => setMode('login')}>
            Ingresar
          </button>
          <button className={mode === 'register' ? styles.active : undefined} type="button" onClick={() => setMode('register')}>
            Registrarme
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={onLogin}>
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
              <strong>asesor@parqueindustrial.com / Asesor123456</strong>
            </div>
          </form>
        ) : (
          <form onSubmit={onRegister}>
            <div className={styles.accountSwitch}>
              <label>
                <input
                  name="accountType"
                  type="radio"
                  value="CLIENT"
                  checked={accountType === 'CLIENT'}
                  onChange={() => setAccountType('CLIENT')}
                />
                Cliente
              </label>
              <label>
                <input
                  name="accountType"
                  type="radio"
                  value="SELLER"
                  checked={accountType === 'SELLER'}
                  onChange={() => setAccountType('SELLER')}
                />
                Productor / trabajador
              </label>
            </div>

            <label className={styles.field}>
              <span>{accountType === 'SELLER' ? 'Nombre del responsable' : 'Nombre completo'}</span>
              <input name="name" required />
            </label>
            <label className={styles.field}>
              <span>Correo</span>
              <input name="email" type="email" required />
            </label>
            <label className={styles.field}>
              <span>Telefono</span>
              <input name="phone" type="tel" />
            </label>
            <label className={styles.field}>
              <span>Distrito</span>
              <input name="district" />
            </label>
            <label className={styles.field}>
              <span>Contrasena</span>
              <input name="password" type="password" minLength={8} required />
            </label>
            <label className={styles.field}>
              <span>Confirmar contrasena</span>
              <input name="confirmPassword" type="password" minLength={8} required />
            </label>

            {accountType === 'SELLER' && (
              <div className={styles.producerBlock}>
                <h2>Datos de productora</h2>
                <label className={styles.field}>
                  <span>Nombre comercial</span>
                  <input name="businessName" required />
                </label>
                <label className={styles.field}>
                  <span>Tipo de productora/taller</span>
                  <input name="producerType" placeholder="Taller local" required />
                </label>
                <label className={styles.field}>
                  <span>Ubicacion</span>
                  <input name="location" required />
                </label>
                <label className={styles.field}>
                  <span>Descripcion</span>
                  <textarea name="description" required />
                </label>
                <label className={styles.field}>
                  <span>Telefono comercial</span>
                  <input name="businessPhone" type="tel" />
                </label>
                <label className={styles.field}>
                  <span>Direccion comercial</span>
                  <input name="address" />
                </label>
              </div>
            )}

            {error && <span className={styles.error}>{error}</span>}

            <button className="primaryButton" type="submit">
              {accountType === 'SELLER' ? 'Registrar productora' : 'Crear cuenta'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
