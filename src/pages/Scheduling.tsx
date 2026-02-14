import React, { useState, useMemo } from 'react';
import {
    Users as UsersIcon,
    CheckSquare,
    Square,
    ChevronLeft,
    ChevronRight
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
    isSameMonth
} from 'date-fns';
import { es } from 'date-fns/locale';
import type { User, AvailabilityTemplate } from '../types';

// Mock Users Data (In a real app, this would come from an API/DB)
const MOCK_MENTORS: User[] = [
    { id: 'm1', name: 'Alvaro Asesor', email: 'alvaro@comfandi.com', role: 'ADVISOR' },
    { id: 'm2', name: 'Beatriz Mentor', email: 'beatriz@comfandi.com', role: 'MENTOR' },
    { id: 'm3', name: 'Carlos Coach', email: 'carlos@comfandi.com', role: 'COACH' },
];

const Scheduling: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([MOCK_MENTORS[0].id]);

    // In a real app, we'd fetch availability for all selected users
    // For now, we simulate shared availability logic
    const [allTemplates] = useState<Record<string, AvailabilityTemplate[]>>({
        'm1': [{ id: 't1', dayOfWeek: 1, startTime: '08:00', endTime: '12:00', weeksCount: 12 }],
        'm2': [{ id: 't2', dayOfWeek: 1, startTime: '10:00', endTime: '14:00', weeksCount: 12 }],
        'm3': [{ id: 't3', dayOfWeek: 3, startTime: '09:00', endTime: '13:00', weeksCount: 12 }],
    });

    const daysInGrid = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const toggleUserSelection = (userId: string) => {
        if (selectedUserIds.includes(userId)) {
            if (selectedUserIds.length > 1) {
                setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
            }
        } else {
            setSelectedUserIds([...selectedUserIds, userId]);
        }
    };

    return (
        <div className="scheduling-page fade-in">
            <header className="page-header">
                <div>
                    <h1>Agendamiento y Cruces</h1>
                    <p>Visualiza la disponibilidad de uno o varios mentores para coordinar sesiones.</p>
                </div>
            </header>

            <div className="scheduling-layout">
                <aside className="filters-sidebar">
                    <div className="filter-group">
                        <div className="filter-header">
                            <UsersIcon size={18} />
                            <h3>Seleccionar Mentores</h3>
                        </div>
                        <div className="user-selection-list">
                            {MOCK_MENTORS.map(mentor => (
                                <div
                                    key={mentor.id}
                                    className={`user-select-item ${selectedUserIds.includes(mentor.id) ? 'active' : ''}`}
                                    onClick={() => toggleUserSelection(mentor.id)}
                                >
                                    {selectedUserIds.includes(mentor.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                    <div className="user-mini-info">
                                        <span className="name">{mentor.name}</span>
                                        <span className="role-tag">{mentor.role}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                <main className="calendar-main">
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
                        {daysInGrid.map((day: Date, idx: number) => {
                            const isCurrentMonth = isSameMonth(day, currentMonth);

                            return (
                                <div
                                    key={idx}
                                    className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''}`}
                                >
                                    <span className="day-number">{format(day, 'd')}</span>
                                    <div className="day-slots multi-user-slots">
                                        {selectedUserIds.map(uid => {
                                            const userTemplates = allTemplates[uid] || [];
                                            const dayTemplates = userTemplates.filter(t => t.dayOfWeek === (day.getDay() === 0 ? 7 : day.getDay())); // Simple check

                                            return dayTemplates.map(t => (
                                                <div key={`${uid}-${t.id}`} className="mini-slot pill-user" title={MOCK_MENTORS.find(m => m.id === uid)?.name}>
                                                    <span className="user-initials">{MOCK_MENTORS.find(m => m.id === uid)?.name.charAt(0)}</span>
                                                    <span className="time">{t.startTime} - {t.endTime}</span>
                                                </div>
                                            ));
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Scheduling;
