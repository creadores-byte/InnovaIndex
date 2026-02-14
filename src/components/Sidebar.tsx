import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    CalendarClock,
    Users,
    Settings,
    LogOut,
    CalendarDays
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        {
            label: 'Dashboard',
            path: '/',
            icon: <LayoutDashboard size={20} />,
            roles: ['ADMIN', 'MANAGER', 'MENTOR', 'COACH', 'ADVISOR', 'ENTREPRENEUR']
        },
        {
            label: 'Mi Disponibilidad',
            path: '/availability',
            icon: <CalendarClock size={20} />,
            roles: ['MENTOR', 'COACH', 'ADVISOR', 'ADMIN']
        },
        {
            label: 'Agendamiento',
            path: '/scheduling',
            icon: <CalendarDays size={20} />,
            roles: ['MANAGER', 'ADMIN']
        },
        {
            label: 'Usuarios',
            path: '/users',
            icon: <Users size={20} />,
            roles: ['ADMIN']
        },
        {
            label: 'Configuración',
            path: '/settings',
            icon: <Settings size={20} />,
            roles: ['ADMIN', 'MANAGER', 'MENTOR', 'COACH', 'ADVISOR', 'ENTREPRENEUR']
        },
    ];

    const filteredItems = navItems.filter(item =>
        user && item.roles.includes(user.role)
    );

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h2>Comfandi</h2>
            </div>
            <nav className="sidebar-nav">
                {filteredItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">{user?.name.charAt(0).toUpperCase()}</div>
                    <div className="user-details">
                        <p className="user-name">{user?.name}</p>
                        <p className="user-role">{user?.role}</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="btn-logout">
                    <LogOut size={18} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
