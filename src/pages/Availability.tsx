/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import {
    Plus,
    Trash2,
    Save,
    Clock,
    Calendar as CalendarIcon,
    Repeat,
    ChevronLeft,
    ChevronRight,
    XCircle,
    FileCheck,
    FileEdit,
    CheckSquare
} from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import type { AvailabilityTemplate, AvailabilityOverride } from '../types';
import { generateMonthAvailability } from '../utils/availability';

// Helper for 15-min intervals
const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
    const hours = Math.floor(i / 4).toString().padStart(2, '0');
    const minutes = (i % 4 * 15).toString().padStart(2, '0');
    return `${hours}:${minutes}`;
});

const Availability: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [view, setView] = useState<'calendar' | 'templates'>('calendar');
    const [isDirty, setIsDirty] = useState(false);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [showManualModal, setShowManualModal] = useState(false);
    const [newManualSlot, setNewManualSlot] = useState({ start: '08:00', end: '12:00' });

    // States for data
    const [templates, setTemplates] = useState<AvailabilityTemplate[]>([]);
    const [overrides, setOverrides] = useState<AvailabilityOverride[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Persistence: Load from LocalStorage
    const checkAuth = async () => {
        const savedTemplates = localStorage.getItem('availability_templates');
        const savedOverrides = localStorage.getItem('availability_overrides');

        if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
        if (savedOverrides) setOverrides(JSON.parse(savedOverrides));

        setIsLoaded(true);
    };
    checkAuth();
}, []);

const handleSave = () => {
    localStorage.setItem('availability_templates', JSON.stringify(templates));
    localStorage.setItem('availability_overrides', JSON.stringify(overrides));
    setIsDirty(false);
    alert('¡Cambios guardados con éxito!');
};

// Calculate day details for current month
const monthData = useMemo(() => {
    return generateMonthAvailability(currentMonth, templates, overrides);
}, [currentMonth, templates, overrides]);

const daysInGrid = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
}, [currentMonth]);

// Handlers
const addTemplate = () => {
    setTemplates([...templates, {
        id: crypto.randomUUID(),
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '12:00',
        weeksCount: 12,
        startDate: format(new Date(), 'yyyy-MM-dd')
    }]);
    setIsDirty(true);
};

const removeTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    setIsDirty(true);
};

const updateTemplate = (id: string, field: keyof AvailabilityTemplate, value: any) => {
    setTemplates(templates.map(t => {
        if (t.id === id) {
            const updated = { ...t, [field]: value };
            if (field === 'startTime' || field === 'endTime') {
                const startIdx = TIME_OPTIONS.indexOf(field === 'startTime' ? value : t.startTime);
                const endIdx = TIME_OPTIONS.indexOf(field === 'endTime' ? value : t.endTime);
                if (endIdx <= startIdx) {
                    updated.endTime = TIME_OPTIONS[Math.min(startIdx + 1, TIME_OPTIONS.length - 1)];
                }
            }
            return updated;
        }
        return t;
    }));
    setIsDirty(true);
};

const toggleOverride = (date: string, templateId: string) => {
    const existing = overrides.find(o => o.date === date && o.templateId === templateId);
    if (existing) {
        setOverrides(overrides.filter(o => o !== existing));
    } else {
        setOverrides([...overrides, {
            id: crypto.randomUUID(),
            date,
            templateId,
            isCancelled: true
        }]);
    }
    setIsDirty(true);
};

const addManualSlot = () => {
    if (!selectedDay) return;

    // Ensure validation before additive
    const startIdx = TIME_OPTIONS.indexOf(newManualSlot.start);
    const endIdx = TIME_OPTIONS.indexOf(newManualSlot.end);
    if (endIdx <= startIdx) {
        alert('La hora de fin debe ser posterior a la hora de inicio');
        return;
    }

    setOverrides([...overrides, {
        id: crypto.randomUUID(),
        date: selectedDay,
        startTime: newManualSlot.start,
        endTime: newManualSlot.end,
        isCancelled: false
    }]);
    setShowManualModal(false);
    setIsDirty(true);
};

const handleManualTimeChange = (field: 'start' | 'end', value: string) => {
    setNewManualSlot(prev => {
        const updated = { ...prev, [field]: value };
        if (field === 'start' || field === 'end') {
            const sIdx = TIME_OPTIONS.indexOf(field === 'start' ? value : prev.start);
            const eIdx = TIME_OPTIONS.indexOf(field === 'end' ? value : prev.end);
            if (eIdx <= sIdx) {
                updated.end = TIME_OPTIONS[Math.min(sIdx + 1, TIME_OPTIONS.length - 1)];
            }
        }
        return updated;
    });
};

const removeOverride = (id: string) => {
    setOverrides(overrides.filter(o => o.id !== id));
    setIsDirty(true);
};

if (!isLoaded) return <div className="loading">Cargando disponibilidad...</div>;

return (
    <div className="availability-page fade-in">
        <header className="page-header">
            <div className="header-titles">
                <h1>Gestión de Disponibilidad</h1>
                <div className="status-indicator">
                    {isDirty ? (
                        <span className="badge-dirty"><FileEdit size={14} /> Cambios sin guardar</span>
                    ) : (
                        <span className="badge-saved"><FileCheck size={14} /> Todo guardado</span>
                    )}
                </div>
            </div>
            <div className="header-controls">
                <div className="view-switcher">
                    <button
                        className={`btn-tab ${view === 'calendar' ? 'active' : ''}`}
                        onClick={() => setView('calendar')}
                    >
                        <CalendarIcon size={18} />
                        <span>Calendario</span>
                    </button>
                    <button
                        className={`btn-tab ${view === 'templates' ? 'active' : ''}`}
                        onClick={() => setView('templates')}
                    >
                        <Repeat size={18} />
                        <span>Plantillas</span>
                    </button>
                </div>
                <button onClick={handleSave} className={`btn-save ${isDirty ? 'pulsing' : ''}`} disabled={!isDirty}>
                    <Save size={18} />
                    <span className="desktop-only">Guardar</span>
                </button>
            </div>
        </header>

        <div className="info-toolbar">
            <div className="legend">
                <div className="legend-item">
                    <span className="box-template"></span>
                    <span>De plantilla (Itinerante)</span>
                </div>
                <div className="legend-item">
                    <span className="box-cancelled"></span>
                    <span>Cancelado / Excepción</span>
                </div>
                <div className="legend-item">
                    <span className="box-manual"></span>
                    <span>Manual / Fecha Única</span>
                </div>
            </div>
        </div>

        {view === 'templates' ? (
            <div className="templates-section">
                <div className="section-header">
                    <h3>Tus Plantillas Recurrentes</h3>
                    <button onClick={addTemplate} className="btn-add">
                        <Plus size={18} />
                        <span>Nueva Plantilla</span>
                    </button>
                </div>
                <div className="availability-grid">
                    {templates.length === 0 && (
                        <div className="empty-state">
                            <Repeat size={48} />
                            <p>No tienes plantillas creadas. Agrega una para repetir horarios por varias semanas.</p>
                        </div>
                    )}
                    {templates.map(template => (
                        <div key={template.id} className="availability-card recurring fade-in">
                            <div className="card-field">
                                <label>
                                    <CalendarIcon size={14} />
                                    <span>Día de la semana</span>
                                </label>
                                <select
                                    value={template.dayOfWeek}
                                    onChange={(e) => updateTemplate(template.id, 'dayOfWeek', parseInt(e.target.value))}
                                >
                                    <option value={1}>Lunes</option>
                                    <option value={2}>Martes</option>
                                    <option value={3}>Miércoles</option>
                                    <option value={4}>Jueves</option>
                                    <option value={5}>Viernes</option>
                                    <option value={6}>Sábado</option>
                                </select>
                            </div>
                            <div className="card-row">
                                <div className="card-field">
                                    <label>
                                        <Clock size={14} />
                                        <span>Inicio</span>
                                    </label>
                                    <select value={template.startTime} onChange={(e) => updateTemplate(template.id, 'startTime', e.target.value)}>
                                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="card-field">
                                    <label>
                                        <Clock size={14} />
                                        <span>Fin</span>
                                    </label>
                                    <select value={template.endTime} onChange={(e) => updateTemplate(template.id, 'endTime', e.target.value)}>
                                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="card-row">
                                <div className="card-field">
                                    <label>
                                        <Repeat size={14} />
                                        <span>Semanas</span>
                                    </label>
                                    <input type="number" min="1" max="52" value={template.weeksCount} onChange={(e) => updateTemplate(template.id, 'weeksCount', parseInt(e.target.value))} />
                                </div>
                                <div className="card-field">
                                    <label>
                                        <CalendarIcon size={14} />
                                        <span>Fecha Inicio</span>
                                    </label>
                                    <input type="date" value={template.startDate} onChange={(e) => updateTemplate(template.id, 'startDate', e.target.value)} />
                                </div>
                            </div>
                            <button onClick={() => removeTemplate(template.id)} className="btn-icon-danger" title="Eliminar plantilla">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <div className="calendar-section">
                <div className="calendar-controls">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="btn-icon">
                        <ChevronLeft />
                    </button>
                    <h2 className="month-label">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </h2>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="btn-icon">
                        <ChevronRight />
                    </button>
                </div>

                <div className="calendar-grid">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                        <div key={d} className="calendar-weekday">{d}</div>
                    ))}
                    {daysInGrid.map((day, idx) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const data = monthData.find(d => d.date === dateStr);
                        const isToday = isSameDay(day, new Date());
                        const isCurrentMonth = isSameMonth(day, currentMonth);

                        return (
                            <div
                                key={idx}
                                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                                onClick={() => {
                                    if (isCurrentMonth) {
                                        setSelectedDay(dateStr);
                                        setShowManualModal(true);
                                    }
                                }}
                            >
                                <div className="day-header">
                                    <span className="day-number">{format(day, 'd')}</span>
                                    <Plus size={10} className="add-hint" />
                                </div>
                                <div className="day-slots">
                                    {data?.slots.map(slot => (
                                        <div
                                            key={slot.id}
                                            className={`mini-slot ${slot.isCancelled ? 'cancelled' : ''} ${slot.type === 'manual' ? 'manual-slot' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (slot.type === 'template' && slot.templateId) {
                                                    toggleOverride(dateStr, slot.templateId);
                                                } else if (slot.type === 'manual') {
                                                    const overrideId = overrides.find(o => o.date === dateStr && o.startTime === slot.startTime)?.id;
                                                    if (overrideId) removeOverride(overrideId);
                                                }
                                            }}
                                            title={slot.isCancelled ? 'Activar horario' : 'Cancelar/Eliminar'}
                                        >
                                            <div className="slot-info">
                                                <span className="time">{slot.startTime} - {slot.endTime}</span>
                                            </div>
                                            {slot.isCancelled ? <XCircle size={10} /> : (slot.type === 'manual' ? <CheckSquare size={10} /> : <Clock size={10} />)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Manual Slot Modal */}
        {showManualModal && (
            <div className="modal-overlay" onClick={() => setShowManualModal(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <h3>Habilitar Horario Especial</h3>
                    <p>Fecha seleccionada: <strong>{selectedDay}</strong></p>

                    <div className="modal-form">
                        <div className="card-row">
                            <div className="card-field">
                                <label>Hora Inicio</label>
                                <select value={newManualSlot.start} onChange={e => handleManualTimeChange('start', e.target.value)}>
                                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="card-field">
                                <label>Hora Fin</label>
                                <select value={newManualSlot.end} onChange={e => handleManualTimeChange('end', e.target.value)}>
                                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowManualModal(false)}>Cancelar</button>
                            <button className="btn-primary" onClick={addManualSlot}>Habilitar Fecha</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
);
};

export default Availability;
