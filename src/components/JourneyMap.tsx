import React from 'react';
import {
    Circle,
    Clock,
    TrendingUp,
    ChevronRight,
    Award
} from 'lucide-react';
import type { JourneyStep } from '../types';

interface JourneyMapProps {
    steps: JourneyStep[];
}

const JourneyMap: React.FC<JourneyMapProps> = ({ steps }) => {
    // Group steps by stage
    const stages = steps.reduce((acc, step) => {
        if (!acc[step.stage]) acc[step.stage] = [];
        acc[step.stage].push(step);
        return acc;
    }, {} as Record<string, JourneyStep[]>);

    return (
        <div className="journey-map-container">
            <div className="journey-track">
                {Object.entries(stages).map(([stageName, stageSteps], stageIdx) => (
                    <div key={stageName} className="journey-stage">
                        <div className="stage-header">
                            <div className="stage-number">{stageIdx + 1}</div>
                            <h3>{stageName}</h3>
                            <div className="stage-badge">{stageSteps.length} Actividades</div>
                        </div>

                        <div className="steps-grid">
                            {stageSteps.map((step, idx) => (
                                <div key={step.id} className="journey-step-card slide-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                                    <div className="step-icon">
                                        {idx === 0 && stageIdx === 0 ? <TrendingUp size={18} /> : <Circle size={18} />}
                                    </div>
                                    <div className="step-content">
                                        <div className="step-type">{step.type}</div>
                                        <h4 className="step-activity">{step.description}</h4>
                                        <div className="step-footer">
                                            <span className="step-hours">
                                                <Clock size={12} />
                                                {step.hours}h
                                            </span>
                                            <span className="step-weight">
                                                {step.deliverable}
                                            </span>
                                        </div>
                                    </div>
                                    {idx < stageSteps.length - 1 && (
                                        <div className="step-connector">
                                            <ChevronRight size={16} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="journey-summary-card">
                <div className="summary-icon">
                    <Award size={32} />
                </div>
                <div className="summary-text">
                    <h3>Tu Meta de Sostenibilidad</h3>
                    <p>Completa todas las actividades para certificar tu empresa con el sello Comfandi.</p>
                </div>
                <div className="summary-stats">
                    <div className="stat">
                        <span className="label">Total Horas</span>
                        <span className="value">{steps.reduce((sum, s) => sum + s.hours, 0)}</span>
                    </div>
                    <div className="stat">
                        <span className="label">Progreso</span>
                        <span className="value">0%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JourneyMap;
