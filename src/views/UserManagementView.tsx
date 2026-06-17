import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  cancelInvitation,
  createInvitation,
  getInvitations,
  resendInvitation,
  type Invitation,
} from '../services/invitationsService';
import { activateUser, deactivateUser, getUsers, removeUser } from '../services/usersService';
import type { ApiRole, User } from '../types';
import styles from './UserManagementView.module.css';

type InternalRole = Extract<ApiRole, 'SELLER' | 'ADVISOR' | 'ADMIN'>;

const roleLabels: Record<ApiRole, string> = {
  CLIENT: 'Cliente',
  SELLER: 'Trabajadores/Productores',
  ADVISOR: 'Asesores',
  ADMIN: 'Administradores',
};

const invitationStatusLabels: Record<Invitation['status'], string> = {
  PENDING: 'Invitacion pendiente',
  ACCEPTED: 'Aceptada',
  EXPIRED: 'Expirada',
  CANCELLED: 'Cancelada',
};

const internalRoles: InternalRole[] = ['ADVISOR', 'SELLER', 'ADMIN'];

export default function UserManagementView() {
  const [usersByRole, setUsersByRole] = useState<Record<InternalRole, User[]>>({
    ADVISOR: [],
    SELLER: [],
    ADMIN: [],
  });
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [role, setRole] = useState<InternalRole>('ADVISOR');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [advisors, sellers, admins, nextInvitations] = await Promise.all([
        getUsers({ role: 'ADVISOR', limit: 10, page: 1 }),
        getUsers({ role: 'SELLER', limit: 10, page: 1 }),
        getUsers({ role: 'ADMIN', limit: 10, page: 1 }),
        getInvitations(),
      ]);

      if (import.meta.env.DEV) {
        console.debug('[admin-users] advisors', advisors.items.length);
        console.debug('[admin-users] sellers', sellers.items.length);
        console.debug('[admin-users] admins', admins.items.length);
        console.debug('[admin-users] invitations', nextInvitations.length);
      }

      setUsersByRole({
        ADVISOR: advisors.items,
        SELLER: sellers.items,
        ADMIN: admins.items,
      });
      setInvitations(nextInvitations);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la gestion de usuarios.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const groupedAccess = useMemo(() => internalRoles.map((entryRole) => ({
    role: entryRole,
    users: usersByRole[entryRole],
    invitations: invitations.filter((invitation) => invitation.role === entryRole && invitation.status === 'PENDING'),
  })), [usersByRole, invitations]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get('email') ?? '').trim();

    setIsSubmitting(true);
    try {
      const invitation = await createInvitation({ email, role });
      setInvitations((current) => [invitation, ...current]);
      setMessage(`Invitacion enviada a ${invitation.email}.`);
      setError('');
      form.reset();
      setRole('ADVISOR');
    } catch (submitError) {
      setMessage('');
      setError(submitError instanceof Error ? submitError.message : 'No se pudo enviar la invitacion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = async (user: User) => {
    if (!user.id) return;

    try {
      const updatedUser = user.isActive === false
        ? await activateUser(user.id)
        : await deactivateUser(user.id);

      setUsersByRole((current) => {
        const userRole = (user.role ?? updatedUser.role) as InternalRole;
        if (!internalRoles.includes(userRole)) return current;

        return {
          ...current,
          [userRole]: updatedUser.isActive === false
            ? current[userRole].filter((entry) => entry.id !== updatedUser.id)
            : current[userRole].map((entry) => (entry.id === updatedUser.id ? updatedUser : entry)),
        };
      });
      setMessage(`${updatedUser.name} fue ${updatedUser.isActive === false ? 'desactivado' : 'activado'}.`);
      setError('');
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'No se pudo actualizar el usuario.');
    }
  };

  const handleRemoveUser = async (user: User) => {
    if (!user.id) return;
    const confirmed = window.confirm('Seguro que deseas eliminar este usuario?');
    if (!confirmed) return;

    try {
      await removeUser(user.id);
      setUsersByRole((current) => {
        const userRole = user.role as InternalRole;
        if (!internalRoles.includes(userRole)) return current;

        return {
          ...current,
          [userRole]: current[userRole].filter((entry) => entry.id !== user.id),
        };
      });
      setMessage(`${user.name} fue desactivado correctamente.`);
      setError('');
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'No se pudo eliminar el usuario.');
    }
  };

  const handleInvitationAction = async (invitationId: string, action: 'cancel' | 'resend') => {
    try {
      const updatedInvitation = action === 'cancel'
        ? await cancelInvitation(invitationId)
        : await resendInvitation(invitationId);

      setInvitations((current) => current.map((invitation) => (
        invitation.id === updatedInvitation.id ? updatedInvitation : invitation
      )));
      setMessage(action === 'cancel' ? 'Invitacion cancelada.' : 'Invitacion reenviada.');
      setError('');
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No se pudo actualizar la invitacion.');
    }
  };

  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.heading}>
          <span className={styles.kicker}>Administracion</span>
          <h1>Gestion de usuarios</h1>
          <p>Invita usuarios internos y administra accesos de asesores, trabajadores y administradores.</p>
        </div>

        <form className={styles.formCard} onSubmit={handleSubmit}>
          <h2>Enviar invitacion</h2>
          <p>El usuario recibira un enlace para completar su registro y definir su contrasena.</p>

          <div className={styles.formInline}>
            <label className={styles.field}>
              <span>Correo</span>
              <input name="email" type="email" required />
            </label>

            <label className={styles.field}>
              <span>Rol</span>
              <select value={role} onChange={(event) => setRole(event.target.value as InternalRole)}>
                <option value="ADVISOR">Asesor</option>
                <option value="SELLER">Trabajador/Productor</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </label>

            <button className="primaryButton" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar invitacion'}
            </button>
          </div>

          {message && <span className={styles.success}>{message}</span>}
          {error && <span className={styles.error}>{error}</span>}
        </form>

        <div className={styles.listCard}>
          <div className={styles.listHeader}>
            <h2>Usuarios internos</h2>
            <button className="accentButton" type="button" onClick={() => void loadData()}>
              Actualizar
            </button>
          </div>

          {isLoading ? (
            <p>Cargando usuarios...</p>
          ) : (
            <div className={styles.columnsGrid}>
              {groupedAccess.map((group) => (
                <section className={styles.groupBlock} key={group.role}>
                  <h3>{roleLabels[group.role]}</h3>

                  {group.users.length === 0 && group.invitations.length === 0 && (
                    <p>No hay registros en esta seccion.</p>
                  )}

                  {group.users.map((user) => (
                    <article className={styles.userRow} key={user.email}>
                      <div>
                        <h3>{user.name}</h3>
                        <p>{user.email}</p>
                        <small>{user.createdAt ? `Creado: ${new Date(user.createdAt).toLocaleDateString('es-PE')}` : 'Fecha no disponible'}</small>
                      </div>
                      <span className={user.isActive === false ? styles.inactive : styles.activeStatus}>
                        {user.isActive === false ? 'Inactivo' : 'Activo'}
                      </span>
                      <div className={styles.inlineActions}>
                        <button type="button" onClick={() => void toggleUserStatus(user)}>
                          {user.isActive === false ? 'Activar' : 'Desactivar'}
                        </button>
                        <button type="button" onClick={() => void handleRemoveUser(user)}>
                          Eliminar
                        </button>
                      </div>
                    </article>
                  ))}

                  {group.invitations.map((invitation) => (
                    <article className={styles.userRow} key={invitation.id}>
                      <div>
                        <h3>{invitation.email}</h3>
                        <p>{invitationStatusLabels[invitation.status]}</p>
                        <small>Invitada: {invitation.createdAt}</small>
                      </div>
                      <span className={styles.inactive}>Pendiente</span>
                      <div className={styles.inlineActions}>
                        <button type="button" onClick={() => void handleInvitationAction(invitation.id, 'resend')}>
                          Reenviar
                        </button>
                        <button type="button" onClick={() => void handleInvitationAction(invitation.id, 'cancel')}>
                          Cancelar
                        </button>
                      </div>
                    </article>
                  ))}
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
