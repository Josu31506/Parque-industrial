import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import {
  activateUser,
  createInternalUser,
  deactivateUser,
  getUsers,
  type InternalUserInput,
} from '../services/usersService';
import type { ApiRole, User } from '../types';
import styles from './UserManagementView.module.css';

type InternalRole = Extract<ApiRole, 'SELLER' | 'ADVISOR' | 'ADMIN'>;

const roleLabels: Record<ApiRole, string> = {
  CLIENT: 'Cliente',
  SELLER: 'Productor',
  ADVISOR: 'Asesor',
  ADMIN: 'Administrador',
};

export default function UserManagementView() {
  const [users, setUsers] = useState<User[]>([]);
  const [role, setRole] = useState<InternalRole>('SELLER');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      setUsers(await getUsers());
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la lista de usuarios.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const data: InternalUserInput = {
      name: String(formData.get('name') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim() || undefined,
      password: String(formData.get('password') ?? ''),
      role,
    };

    if (role === 'SELLER') {
      data.producer = {
        businessName: String(formData.get('businessName') ?? '').trim(),
        type: String(formData.get('producerType') ?? '').trim(),
        location: String(formData.get('location') ?? '').trim(),
        description: String(formData.get('description') ?? '').trim(),
      };
    }

    setIsSubmitting(true);
    try {
      const createdUser = await createInternalUser(data);
      setUsers((currentUsers) => [createdUser, ...currentUsers]);
      setMessage(`${roleLabels[createdUser.role ?? role]} creado correctamente.`);
      setError('');
      form.reset();
      setRole('SELLER');
    } catch (submitError) {
      setMessage('');
      setError(submitError instanceof Error ? submitError.message : 'No se pudo crear el usuario interno.');
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

      setUsers((currentUsers) => currentUsers.map((entry) => (
        entry.id === updatedUser.id ? updatedUser : entry
      )));
      setMessage(`${updatedUser.name} fue ${updatedUser.isActive === false ? 'desactivado' : 'activado'}.`);
      setError('');
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'No se pudo actualizar el usuario.');
    }
  };

  return (
    <main className={styles.page}>
      <section className={`${styles.content} container`}>
        <div className={styles.heading}>
          <span className={styles.kicker}>Administracion</span>
          <h1>Gestion de usuarios</h1>
          <p>Crea trabajadores internos y administra el acceso de usuarios registrados.</p>
        </div>

        <div className={styles.layout}>
          <form className={styles.formCard} onSubmit={handleSubmit}>
            <h2>Crear trabajador</h2>
            <p>Solo los administradores pueden crear productores, asesores o administradores.</p>

            <label className={styles.field}>
              <span>Rol interno</span>
              <select value={role} onChange={(event) => setRole(event.target.value as InternalRole)}>
                <option value="SELLER">Productor</option>
                <option value="ADVISOR">Asesor</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>Nombre del responsable</span>
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
              <span>Contrasena temporal</span>
              <input name="password" type="password" minLength={8} required />
            </label>

            {role === 'SELLER' && (
              <div className={styles.producerBox}>
                <h3>Productora asociada</h3>
                <label className={styles.field}>
                  <span>Nombre del taller</span>
                  <input name="businessName" required />
                </label>
                <label className={styles.field}>
                  <span>Tipo</span>
                  <input name="producerType" placeholder="Productora local" required />
                </label>
                <label className={styles.field}>
                  <span>Ubicacion</span>
                  <input name="location" placeholder="Villa El Salvador" required />
                </label>
                <label className={styles.field}>
                  <span>Descripcion</span>
                  <textarea name="description" required />
                </label>
              </div>
            )}

            {message && <span className={styles.success}>{message}</span>}
            {error && <span className={styles.error}>{error}</span>}

            <button className="primaryButton" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear usuario interno'}
            </button>
          </form>

          <div className={styles.listCard}>
            <div className={styles.listHeader}>
              <h2>Usuarios registrados</h2>
              <button className="accentButton" type="button" onClick={() => void loadUsers()}>
                Actualizar
              </button>
            </div>

            {isLoading ? (
              <p>Cargando usuarios...</p>
            ) : (
              <div className={styles.userList}>
                {users.map((user) => (
                  <article className={styles.userRow} key={user.email}>
                    <div>
                      <h3>{user.name}</h3>
                      <p>{user.email}</p>
                      {user.phone && <small>{user.phone}</small>}
                    </div>
                    <span className={styles.role}>{roleLabels[user.role ?? 'CLIENT']}</span>
                    <span className={user.isActive === false ? styles.inactive : styles.activeStatus}>
                      {user.isActive === false ? 'Inactivo' : 'Activo'}
                    </span>
                    <button type="button" onClick={() => void toggleUserStatus(user)}>
                      {user.isActive === false ? 'Activar' : 'Desactivar'}
                    </button>
                  </article>
                ))}

                {!users.length && <p>No hay usuarios registrados.</p>}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
