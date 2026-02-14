import React, { useEffect, useState } from 'react';
import {
    syncJourneysFromSheet,
    getCachedJourneys,
    saveJourneysToCache
} from '../services/googleSheets';
import JourneyMap from '../components/JourneyMap';
import type { JourneyStep } from '../types';
import { RefreshCcw, LayoutDashboard } from 'lucide-react';

const Dashboard: React.FC = () => {
    const [steps, setSteps] = useState<JourneyStep[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const cached = getCachedJourneys();
        if (cached.length > 0) {
            setSteps(cached);
        } else {
            handleSync();
        }
    }, []);

    const handleSync = async () => {
        setLoading(true);
        try {
            const freshSteps = await syncJourneysFromSheet();
            setSteps(freshSteps);
            saveJourneysToCache(freshSteps);
        } catch (error) {
            console.error('Error syncing dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-page fade-in">
            <header className="page-header">
                <div className="header-titles">
                    <h1>Mí Ruta de Aprendizaje</h1>
                    <p className="subtitle">Visualiza tu camino hacia la sostenibilidad empresarial</p>
                </div>
                <div className="header-actions">
                    <button
                        className={`btn-sync ${loading ? 'spinning' : ''}`}
                        onClick={handleSync}
                        disabled={loading}
                    >
                        <RefreshCcw size={18} />
                        <span>Sincronizar Ruta</span>
                    </button>
                </div>
            </header>

            <div className="dashboard-content">
                {steps.length > 0 ? (
                    <JourneyMap steps={steps} />
                ) : (
                    <div className="empty-state">
                        <LayoutDashboard size={48} />
                        <h3>No hay datos de tu ruta</h3>
                        <p>Pulsa sincronizar para cargar tu journey desde Google Sheets.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
