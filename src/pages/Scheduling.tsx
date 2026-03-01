import React, { useState, useMemo, useEffect } from 'react';
import {
    Users as UsersIcon,
    CheckSquare,
    Square,
    ChevronLeft,
    ChevronRight,
    RefreshCcw
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
import type { User } from '../types';
import {
    getCachedUsers,
    syncAvailabilityFromSheet,
    getCachedAvailability,
    saveAvailabilityToCache
} from '../services/googleSheets';

const Scheduling: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [users, setUsers] = useState<User[]>([]);
    const [availability, setAvailability] = useState<any[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncMessage, setSyncMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        // Load mentors/coaches/advisors from cache
        const allUsers = getCachedUsers();
        const mentors = allUsers.filter(u => ['MENTOR', 'COACH', 'ADVISOR', 'ADMIN'].includes(u.role));
        setUsers(mentors);

        // Load availability from cache
        const cachedAvailability = getCachedAvailability();
        setAvailability(cachedAvailability);

        // Auto-select first mentor if available
        if (mentors.length > 0 && selectedUserIds.length === 0) {
            setSelectedUserIds([mentors[0].id]);
        }
    }, []);

    const handleSync = async () => {
        setLoading(true);
        setSyncMessage(null);
        try {
            const freshAvailability = await syncAvailabilityFromSheet();
            setAvailability(freshAvailability);
            saveAvailabilityToCache(freshAvailability);
            setSyncMessage({ text: '¡Disponibilidad sincronizada con éxito!', type: 'success' });
        } catch (error) {
            setSyncMessage({ text: 'Error al sincronizar disponibilidad.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

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

    // Filter availability for selected users
    const filteredAvailability = useMemo(() => {
        const selectedEmails = users
            .filter(u => selectedUserIds.includes(u.id))
            .map(u => u.email.toLowerCase());

        return availability.filter(slot =>
            selectedEmails.includes(slot.userEmail.toLowerCase())
        );
    }, [availability, selectedUserIds, users]);

    return (
        <div className="scheduling-page fade-in">
            <header className="page-header">
                <div>
                    <h1>Agendamiento y Cruces</h1>
                    <p>Visualiza la disponibilidad de uno o varios mentores para coordinar sesiones.</p>
                </div>
                <div className="header-actions">
                    <button
                        className={`btn-sync ${loading ? 'spinning' : ''}`}
                        onClick={handleSync}
                        disabled={loading}
                    >
                        <RefreshCcw size={18} />
                        <span>{loading ? 'Sincronizando...' : 'Sincronizar Disponibilidad'}</span>
                    </button>
                </div>
            </header>

            {syncMessage && (
                <div className={`sync-alert ${syncMessage.type} slide-in`}>
                    {syncMessage.text}
                </div>
            )}

            <div className="scheduling-layout">
                <aside className="filters-sidebar">
                    <div className="filter-group">
                        <div className="filter-header">
                            <UsersIcon size={18} />
                            <h3>Seleccionar Mentores</h3>
                        </div>
                        <div className="user-selection-list">
                            {users.length === 0 ? (
                                <p className="empty-hint">Sincroniza usuarios en Gestión de Usuarios primero.</p>
                            ) : (
                                users.map(user => (
                                    <div
                                        key={user.id}
                                        className={`user-select-item ${selectedUserIds.includes(user.id) ? 'active' : ''}`}
                                        onClick={() => toggleUserSelection(user.id)}
                                    >
                                        {selectedUserIds.includes(user.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                        <div className="user-mini-info">
                                            <span className="name">{user.name} <span className="separator">-</span> {user.role}</span>
                                        </div>
                                    </div>
                                ))
                            )}
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
                            const dateStr = format(day, 'yyyy-MM-dd');

                            // Find slots for this specific day
                            const daySlots = filteredAvailability.filter(s => s.date === dateStr);

                            return (
                                <div
                                    key={idx}
                                    className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''}`}
                                >
                                    <span className="day-number">{format(day, 'd')}</span>
                                    <div className="day-slots multi-user-slots">
                                        {daySlots.map((slot, sIdx) => (
                                            <div
                                                key={`${slot.userEmail}-${sIdx}`}
                                                className="mini-slot pill-user"
                                                title={`${slot.userName} (${slot.userRole}): ${slot.startTime} - ${slot.endTime}`}
                                            >
                                                <span className="user-initials">{slot.userName.charAt(0)}</span>
                                                <span className="time">{slot.startTime} - {slot.endTime}</span>
                                            </div>
                                        ))}
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
