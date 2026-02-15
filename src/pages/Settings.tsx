import React, { useState, useEffect } from 'react';
import {
    Save,
    FileText,
    Link2,
    AlertCircle,
    CheckCircle2,
    Copy,
    ExternalLink,
    ShieldCheck,
    Wand2
} from 'lucide-react';
import { getSheetId, saveSheetId, createSheetStructure } from '../services/googleSheets';
import { initGoogleAuth, requestAccessToken, getAccessToken } from '../services/googleAuth';

const Settings: React.FC = () => {
    const [sheetId, setSheetId] = useState('');
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);

    useEffect(() => {
        setSheetId(getSheetId());
        initGoogleAuth().then(() => {
            if (getAccessToken()) setIsConnected(true);
        });
    }, []);

    const handleSave = () => {
        if (!sheetId.trim()) {
            setError('El ID del documento no puede estar vacío.');
            return;
        }
        // Extract ID if URL is provided
        let extractedId = sheetId.trim();
        if (extractedId.includes('/d/')) {
            extractedId = extractedId.split('/d/')[1].split('/')[0];
        }

        saveSheetId(extractedId);
        setSheetId(extractedId);
        setSaved(true);
        setError(null);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleConnect = async () => {
        try {
            await requestAccessToken();
            setIsConnected(true);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError('Error al conectar con Google. Revisa la ventana emergente.');
        }
    };

    const handleInitialize = async () => {
        if (!isConnected) {
            setError('Debes conectar con Google primero.');
            return;
        }
        setIsInitializing(true);
        setError(null);

        try {
            const token = getAccessToken();
            if (!token) throw new Error('No access token');

            await createSheetStructure(token, sheetId);

            setSaved(true);
        } catch (err) {
            setError('Error al inicializar el archivo. Verifica los permisos.');
        } finally {
            setIsInitializing(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const requiredTabs = [
        { name: 'Usuarios y Beneficiarios', columns: ['Nombre', 'Correo electrónico', 'Rol'] },
        { name: 'Base empresas', columns: ['ID', 'Razón social', 'NIT', 'Correo', 'Teléfono', 'Dirección'] },
        {
            name: 'Journey',
            columns: [
                'Fase', 'Etapa', 'Mes', 'Código', 'Tipo', 'Horas (h)',
                'Descripción de la actividad', 'Entregable', 'Semanas Cohortes'
            ]
        }
    ];

    return (
        <div className="settings-page fade-in">
            <header className="page-header">
                <div className="header-titles">
                    <h1>Configuración del Sistema</h1>
                    <p className="subtitle">Seguridad y Estructura de Datos</p>
                </div>
                <div className="header-actions">
                    <button
                        className={`btn-google ${isConnected ? 'connected' : ''}`}
                        onClick={handleConnect}
                    >
                        <ShieldCheck size={18} />
                        <span>{isConnected ? 'Conectado con Google' : 'Conectar con Google'}</span>
                    </button>
                </div>
            </header>

            <div className="settings-grid">
                <section className="settings-card shadow-sm">
                    <div className="card-header">
                        <Link2 size={20} className="text-secondary" />
                        <h3>Configuración del Documento</h3>
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <label>Enlace o ID de Google Sheets</label>
                            <div className="input-with-action">
                                <input
                                    type="text"
                                    value={sheetId}
                                    onChange={(e) => setSheetId(e.target.value)}
                                    placeholder="Pegar enlace del documento aquí..."
                                />
                                <button className="btn-primary" onClick={handleSave}>
                                    <Save size={18} />
                                    <span>Guardar</span>
                                </button>
                            </div>
                            <p className="help-text">
                                Puedes pegar la URL completa del navegador. La App extraerá el ID automáticamente.
                            </p>
                        </div>

                        <div className="action-box-setup">
                            <div className="setup-info">
                                <h4>Inicialización Automática</h4>
                                <p>Si el archivo está en blanco, este botón creará las pestañas y encabezados requeridos automáticamente.</p>
                            </div>
                            <button
                                className={`btn-magic ${isInitializing ? 'loading' : ''}`}
                                onClick={handleInitialize}
                                disabled={isInitializing || !isConnected}
                            >
                                <Wand2 size={18} />
                                <span>{isInitializing ? 'Configurando...' : 'Auto-Configurar Archivo'}</span>
                            </button>
                        </div>


                        {saved && (
                            <div className="settings-alert success slide-in">
                                <CheckCircle2 size={18} />
                                <span>Operación exitosa.</span>
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
                        <h3>Estructura Requerida</h3>
                    </div>
                    <div className="card-body">
                        <div className="tabs-guide">
                            {requiredTabs.map((tab) => (
                                <div key={tab.name} className="tab-info-item">
                                    <div className="tab-name-row">
                                        <span className="tab-label">Pestaña:</span>
                                        <strong className="tab-value">{tab.name}</strong>
                                        <button
                                            className="btn-copy-small"
                                            onClick={() => copyToClipboard(tab.name)}
                                            title="Copiar nombre"
                                        >
                                            <Copy size={12} />
                                        </button>
                                    </div>
                                    <div className="columns-list">
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
                                <h4>Seguridad Activa</h4>
                                <p>Al conectar con Google, la aplicación puede acceder a este archivo aunque sea <strong>Privado</strong>. No necesitas compartirlo con "Cualquiera con el enlace".</p>
                                <a
                                    href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="link-external"
                                >
                                    Abrir en Google Sheets <ExternalLink size={14} />
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
