import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
import styles from './ErrorBoundary.module.css';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ui] ErrorBoundary', error, info);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <span>Algo no cargo bien</span>
          <h1>No pudimos mostrar esta pantalla</h1>
          <p>
            La aplicacion encontro un problema inesperado. Puedes recargar la pagina
            para intentar nuevamente.
          </p>
          <button className="primaryButton" type="button" onClick={this.handleReload}>
            Recargar pagina
          </button>
        </section>
      </main>
    );
  }
}
