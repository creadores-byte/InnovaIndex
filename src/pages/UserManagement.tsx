import React, { useState, useMemo, useEffect } from 'react';
import {
    RefreshCcw,
    Search,
    Filter,
    Mail,
    MoreVertical
} from 'lucide-react';
import { syncUsersFromSheet, getCachedUsers, saveUsersToCache } from '../services/googleSheets';
import type { User, Role } from '../types';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
    const [syncMessage, setSyncMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        setUsers(getCachedUsers());
    }, []);

    const handleSync = async () => {
        setLoading(true);
        setSyncMessage(null);
        try {
            const freshUsers = await syncUsersFromSheet();
            setUsers(freshUsers);
            saveUsersToCache(freshUsers);
            setSyncMessage({ text: `¡Sincronización exitosa! ${freshUsers.length} usuarios cargados.`, type: 'success' });
        } catch (_error) {
            setSyncMessage({ text: 'Error al sincronizar con Google Sheets. Verifica el acceso al documento.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch =
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [users, searchTerm, roleFilter]);

    const getRoleBadgeClass = (role: Role) => {
        switch (role) {
            case 'ADMIN': return 'badge-admin';
            case 'MANAGER': return 'badge-manager';
            case 'MENTOR': return 'badge-mentor';
            case 'COACH': return 'badge-coach';
            case 'ADVISOR': return 'badge-advisor';
            default: return 'badge-entrepreneur';
        }
    };

    return (
        <div className="user-management-page fade-in">
            <header className="page-header">
                <div className="header-titles">
                    <h1>Gestión de Usuarios</h1>
                    <p className="subtitle">Administra los accesos y roles vinculados a Google Sheets</p>
                </div>
                <div className="header-actions">
                    <button
                        className={`btn-sync ${loading ? 'spinning' : ''}`}
                        onClick={handleSync}
                        disabled={loading}
                    >
                        <RefreshCcw size={18} />
                        <span>{loading ? 'Sincronizando...' : 'Sincronizar con Documento'}</span>
                    </button>
                </div>
            </header>

            {syncMessage && (
                <div className={`sync-alert ${syncMessage.type} slide-in`}>
                    {syncMessage.text}
                </div>
            )}

            <div className="management-container">
                <div className="filters-bar">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <Filter size={18} className="filter-icon" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as any)}
                        >
                            <option value="ALL">Todos los Roles</option>
                            <option value="ADMIN">Administrador</option>
                            <option value="MANAGER">Gestor</option>
                            <option value="MENTOR">Mentor</option>
                            <option value="COACH">Coach</option>
                            <option value="ADVISOR">Asesor</option>
                            <option value="ENTREPRENEUR">Empresa / Emprendedor</option>
                        </select>
                    </div>

                    <div className="stats-mini">
                        <span>Total: <strong>{filteredUsers.length}</strong></span>
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Rol</th>
                                <th>Contacto</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="empty-row">
                                        {loading ? 'Cargando datos...' : 'No se encontraron usuarios o necesitas sincronizar.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="user-row">
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar-small">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="user-info-text">
                                                    <span className="name">{user.name}</span>
                                                    <span className="id-tag">#{user.id.split('-')[1]}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="contact-cell">
                                                <Mail size={14} />
                                                <span>{user.email}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="status-dot active">Activo</span>
                                        </td>
                                        <td>
                                            <div className="row-actions">
                                                <button className="btn-icon-table" title="Ver detalles"><MoreVertical size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
