import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  acceptInvitation,
  validateInvitation,
  type Invitation,
} from '../services/invitationsService';
import type { User, ViewName } from '../types';
import styles from './AcceptInvitationView.module.css';

type AcceptInvitationViewProps = {
  onAccepted: (user: User, view: ViewName) => void;
  onNavigate: (view: ViewName) => void;
};

const roleLabels: Record<Invitation['role'], string> = {
  SELLER: 'Productor',
  ADVISOR: 'Asesor',
  ADMIN: 'Administrador',
};

const getTokenFromUrl = () => new URLSearchParams(window.location.search).get('token') ?? '';

const getDestinationForRole = (role: Invitation['role']): ViewName => {
  if (role === 'SELLER') return 'sellerDashboard';
  if (role === 'ADVISOR') return 'adminQuotes';
  return 'userManagement';
};

export default function AcceptInvitationView({ onAccepted, onNavigate }: AcceptInvitationViewProps) {
  const token = useMemo(getTokenFromUrl, []);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadInvitation = async () => {
      if (!token) {
        setError('El enlace de invitacion no es valido.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await validateInvitation(token);
        if (isMounted) {
          setInvitation(response);
          setError('');
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudo validar la invitacion.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadInvitation();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invitation) return;

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    if (password !== confirmPassword) {
      setPasswordMismatch(true);
      return;
    }

    setPasswordMismatch(false);
    setIsSubmitting(true);
    setError('');

    try {
      const user = await acceptInvitation({
        token,
        name: String(formData.get('name') ?? '').trim(),
        phone: String(formData.get('phone') ?? '').trim() || undefined,
        password,
        producerData: invitation.role === 'SELLER' && !invitation.producer
          ? {
            businessName: String(formData.get('businessName') ?? '').trim(),
            type: String(formData.get('producerType') ?? '').trim(),
            location: String(formData.get('location') ?? '').trim(),
            description: String(formData.get('description') ?? '').trim(),
          }
          : undefined,
      });

      onAccepted(user, getDestinationForRole(user.role as Invitation['role']));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo aceptar la invitacion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.card}>
          <span className={styles.kicker}>Parque Industrial Conecta</span>
          <h1>Aceptar invitacion</h1>

          {isLoading && <p>Cargando invitacion...</p>}
          {error && <p className={styles.error}>{error}</p>}

          {!isLoading && !error && invitation && (
            <>
              <div className={styles.summary}>
                <p><span>Correo</span><strong>{invitation.email}</strong></p>
                <p><span>Rol</span><strong>{roleLabels[invitation.role]}</strong></p>
                <p><span>Expira</span><strong>{invitation.expiresAt}</strong></p>
                {invitation.producer && (
                  <p><span>Productora</span><strong>{invitation.producer.name}</strong></p>
                )}
              </div>

              <form className={styles.form} onSubmit={handleSubmit}>
                <label>
                  <span>Nombre completo</span>
                  <input name="name" required />
                </label>
                <label>
                  <span>Telefono</span>
                  <input name="phone" type="tel" />
                </label>
                <label>
                  <span>Contrasena</span>
                  <input name="password" type="password" minLength={8} required />
                </label>
                <label>
                  <span>Confirmar contrasena</span>
                  <input name="confirmPassword" type="password" minLength={8} required />
                </label>

                {invitation.role === 'SELLER' && !invitation.producer && (
                  <div className={styles.producerBox}>
                    <h2>Datos de la productora</h2>
                    <label>
                      <span>Nombre del taller</span>
                      <input name="businessName" required />
                    </label>
                    <label>
                      <span>Tipo</span>
                      <input name="producerType" defaultValue="Productora local" required />
                    </label>
                    <label>
                      <span>Ubicacion</span>
                      <input name="location" defaultValue="Villa El Salvador" required />
                    </label>
                    <label>
                      <span>Descripcion</span>
                      <textarea name="description" required />
                    </label>
                  </div>
                )}

                {passwordMismatch && <p className={styles.error}>Las contrasenas no coinciden.</p>}

                <div className={styles.actions}>
                  <button className="primaryButton" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Activando cuenta...' : 'Activar cuenta'}
                  </button>
                  <button type="button" onClick={() => onNavigate('home')}>
                    Volver al inicio
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
