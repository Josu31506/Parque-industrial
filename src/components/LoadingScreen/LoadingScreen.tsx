import styles from './LoadingScreen.module.css';

type LoadingScreenProps = {
  message?: string;
  submessage?: string;
};

export default function LoadingScreen({
  message = 'Cargando tu sesión...',
  submessage = 'Estamos preparando tu panel.',
}: LoadingScreenProps) {
  return (
    <main className={styles.screen} aria-busy="true" aria-live="polite">
      <section className={styles.card}>
        <div className={styles.spinner} aria-hidden="true" />
        <h1 className={styles.brand}>Parque Industrial Conecta</h1>
        <p className={styles.message}>{message}</p>
        <p className={styles.submessage}>{submessage}</p>
      </section>
    </main>
  );
}
