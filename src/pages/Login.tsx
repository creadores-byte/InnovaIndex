import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<Role>('ENTREPRENEUR');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await login(email, role);
        navigate('/');
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>App Comfandi</h1>
                <p>Inicia sesión para continuar</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Correo Electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    <div className="form-group">
                        <label>Rol</label>
                        <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                            <option value="ADMIN">Administrador</option>
                            <option value="MANAGER">Gestor</option>
                            <option value="MENTOR">Mentor</option>
                            <option value="COACH">Coach</option>
                            <option value="ADVISOR">Asesor</option>
                            <option value="ENTREPRENEUR">Emprendedor</option>
                        </select>
                    </div>
                    <button type="submit" className="btn-primary">Ingresar</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
