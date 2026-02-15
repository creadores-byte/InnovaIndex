import React, { useState, useMemo, useEffect } from 'react';
import {
    RefreshCcw,
    Search,
    Building2,
    Phone,
    Mail,
    MapPin,
    MoreVertical,
    FileText
} from 'lucide-react';
import { syncCompaniesFromSheet, getCachedCompanies, saveCompaniesToCache } from '../services/googleSheets';
import type { Company } from '../types';

const CompanyManagement: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [syncMessage, setSyncMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        setCompanies(getCachedCompanies());
    }, []);

    const handleSync = async () => {
        setLoading(true);
        setSyncMessage(null);
        try {
            const freshCompanies = await syncCompaniesFromSheet();
            setCompanies(freshCompanies);
            saveCompaniesToCache(freshCompanies);
            setSyncMessage({ text: `¡Sincronización exitosa! ${freshCompanies.length} empresas cargadas.`, type: 'success' });
        } catch (error) {
            setSyncMessage({ text: 'Error al sincronizar con Google Sheets. Verifica el acceso al documento.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const filteredCompanies = useMemo(() => {
        return companies.filter(company => {
            return (
                company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                company.nit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                company.id.toLowerCase().includes(searchTerm.toLowerCase())
            );
        });
    }, [companies, searchTerm]);

    return (
        <div className="company-management-page fade-in">
            <header className="page-header">
                <div className="header-titles">
                    <h1>Base de Empresas</h1>
                    <p className="subtitle">Gestión centralizada de organizaciones y sus identificadores únicos</p>
                </div>
                <div className="header-actions">
                    <button
                        className={`btn-sync ${loading ? 'spinning' : ''}`}
                        onClick={handleSync}
                        disabled={loading}
                    >
                        <RefreshCcw size={18} />
                        <span>{loading ? 'Sincronizando...' : 'Sincronizar Empresas'}</span>
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
                            placeholder="Buscar por nombre, NIT o ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="stats-mini">
                        <span>Empresas: <strong>{filteredCompanies.length}</strong></span>
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Empresa</th>
                                <th>NIT</th>
                                <th>Contacto</th>
                                <th>Ubicación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCompanies.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="empty-row">
                                        {loading ? 'Cargando datos...' : 'No se encontraron empresas o necesitas sincronizar.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredCompanies.map((company) => (
                                    <tr key={company.id} className="user-row">
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar-small company">
                                                    <Building2 size={16} />
                                                </div>
                                                <div className="user-info-text">
                                                    <span className="name">{company.name}</span>
                                                    <span className="id-tag">{company.id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="nitro-cell">
                                                <FileText size={14} className="text-secondary" />
                                                <span>{company.nit}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="contact-info-stack">
                                                <div className="contact-cell">
                                                    <Mail size={12} />
                                                    <span>{company.email}</span>
                                                </div>
                                                <div className="contact-cell">
                                                    <Phone size={12} />
                                                    <span>{company.phone}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="contact-cell">
                                                <MapPin size={14} />
                                                <span>{company.address}</span>
                                            </div>
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

export default CompanyManagement;
