import React, { useState, useEffect } from 'react';
import {
    Save,
    FileText,
    Link2,
    AlertCircle,
    CheckCircle2,
    Copy,
    ExternalLink
} from 'lucide-react';
import { getSheetId, saveSheetId } from '../services/googleSheets';

const Settings: React.FC = () => {
    const [sheetId, setSheetId] = useState('');
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setSheetId(getSheetId());
    }, []);

    const handleSave = () => {
        if (!sheetId.trim()) {
            setError('El ID del documento no puede estar vacío.');
            return;
        }
        saveSheetId(sheetId.trim());
        setSaved(true);
        setError(null);
        setTimeout(() => setSaved(false), 3000);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Simple visual feedback could be added here
    };

    const requiredTabs = [
        { name: 'Usuarios y Beneficiarios', gid: '0', columns: ['Nombre', 'Correo electrónico', 'Rol'] },
        { name: 'Base empresas', gid: '782223446', columns: ['Empresa', 'NIT', 'Correo'] },
        { name: 'Journey', gid: '2104648175', columns: ['Etapa', 'Actividad', 'Peso porcentual', 'Horas'] }
    ];

    return (
        <div className="settings-page fade-in">
            <header className="page-header">
                <div className="header-titles">
                    <h1>Configuración del Sistema</h1>
                    <p className="subtitle">Administra la conexión con Google Sheets y la estructura de datos</p>
                </div>
            </header>

            <div className="settings-grid">
                <section className="settings-card shadow-sm">
                    <div className="card-header">
                        <Link2 size={20} className="text-secondary" />
                        <h3>Conexión con Google Sheets</h3>
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <label>ID del Documento de Google Sheets</label>
                            <div className="input-with-action">
                                <input
                                    type="text"
                                    value={sheetId}
                                    onChange={(e) => setSheetId(e.target.value)}
                                    placeholder="Pegar ID del documento aquí..."
                                />
                                <button className="btn-primary" onClick={handleSave}>
                                    <Save size={18} />
                                    <span>Guardar</span>
                                </button>
                            </div>
                            <p className="help-text">
                                El ID es la cadena de caracteres larga en la URL de tu hoja de cálculo.
                            </p>
                        </div>

                        {saved && (
                            <div className="settings-alert success slide-in">
                                <CheckCircle2 size={18} />
                                <span>Configuración guardada correctamente.</span>
                            </div>
                        )}

                        {error && (
                            <div className="settings-alert error slide-in">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                </section>

                <section className="settings-card shadow-sm">
                    <div className="card-header">
                        <FileText size={20} className="text-secondary" />
                        <h3>Guía de Estructura de Datos</h3>
                    </div>
                    <div className="card-body">
                        <p className="description">
                            Para que la aplicación funcione correctamente, tu Google Sheet debe tener las siguientes pestañas con sus respectivos encabezados:
                        </p>

                        <div className="tabs-guide">
                            {requiredTabs.map((tab) => (
                                <div key={tab.name} className="tab-info-item">
                                    <div className="tab-name-row">
                                        <span className="tab-label">Pestaña:</span>
                                        <strong className="tab-value">{tab.name}</strong>
                                        <button
                                            className="btn-copy-small"
                                            onClick={() => copyToClipboard(tab.name)}
                                            title="Copiar nombre de pestaña"
                                        >
                                            <Copy size={12} />
                                        </button>
                                    </div>
                                    <div className="columns-list">
                                        <span className="columns-label">Columnas requeridas:</span>
                                        <div className="badges-row">
                                            {tab.columns.map(col => (
                                                <span key={col} className="column-badge">{col}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="info-box-blue">
                            <AlertCircle size={20} />
                            <div>
                                <h4>¿Cómo empezar?</h4>
                                <p>Crea un archivo nuevo, añade las pestañas indicadas y pega tu información. Asegúrate de que el documento esté compartido para que Anyone with the link can view.</p>
                                <a
                                    href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="link-external"
                                >
                                    Abrir Documento Actual <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Settings;
