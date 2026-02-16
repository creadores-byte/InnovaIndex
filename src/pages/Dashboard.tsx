import React, { useEffect, useState } from 'react';
import {
    syncJourneysFromSheet,
    getCachedJourneys,
    saveJourneysToCache,
    type JourneyYear
} from '../services/googleSheets';
import JourneyMap from '../components/JourneyMap';
import type { JourneyStep } from '../types';
import { RefreshCcw, LayoutDashboard, Calendar } from 'lucide-react';

const Dashboard: React.FC = () => {
    const [steps, setSteps] = useState<JourneyStep[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedYear, setSelectedYear] = useState<JourneyYear>('2026');

    useEffect(() => {
        const cached = getCachedJourneys(selectedYear);
        if (cached.length > 0) {
            setSteps(cached);
        } else {
            handleSync(selectedYear);
        }
    }, [selectedYear]);

    const handleSync = async (year: JourneyYear = selectedYear) => {
        setLoading(true);
        try {
            const freshSteps = await syncJourneysFromSheet(year);
            setSteps(freshSteps);
            saveJourneysToCache(freshSteps, year);
        } catch (error) {
            console.error(`Error syncing dashboard for ${year}:`, error);
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
                    <div className="year-selector">
                        <Calendar size={18} />
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value as JourneyYear)}
                            className="select-minimal"
                        >
                            <option value="2026">Journey 2026</option>
                            <option value="2025">Journey 2025</option>
                        </select>
                    </div>
                    <button
                        className={`btn-sync ${loading ? 'spinning' : ''}`}
                        onClick={() => handleSync()}
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
                        <h3>No hay datos de tu ruta {selectedYear}</h3>
                        <p>Pulsa sincronizar para cargar tu journey desde Google Sheets.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
