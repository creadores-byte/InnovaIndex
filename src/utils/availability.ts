import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    format,
    getDay,
    parseISO,
    addDays,
    startOfDay,
    nextDay,
    isBefore
} from 'date-fns';
import type { AvailabilityTemplate, AvailabilityOverride, DayAvailability } from '../types';

export const generateMonthAvailability = (
    month: Date,
    templates: AvailabilityTemplate[],
    overrides: AvailabilityOverride[]
): DayAvailability[] => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayOfWeek = getDay(day);
        const daySlots: DayAvailability['slots'] = [];
        const currentDay = startOfDay(day);

        // 1. Process Templates (Recurring)
        templates.forEach(template => {
            if (template.dayOfWeek === dayOfWeek) {
                // Parse correctly
                const startDateStr = template.startDate || format(new Date(), 'yyyy-MM-dd');
                const startDate = startOfDay(parseISO(startDateStr));
                const weeksCount = Number(template.weeksCount) || 1;

                // Find the very first occurrence of this dayOfWeek on or after startDate
                let firstOccurrence = startDate;
                if (getDay(startDate) !== template.dayOfWeek) {
                    firstOccurrence = nextDay(startDate, template.dayOfWeek as any);
                }

                // Calculate the expiration date
                // 1 week means only the first occurrence
                // 2 weeks means firstOccurrence and firstOccurrence + 7 days
                // Expiration is therefore firstOccurrence + ((weeksCount - 1) * 7) + 1 day
                const expirationDate = addDays(firstOccurrence, (weeksCount - 1) * 7 + 1);

                const hasStarted = !isBefore(currentDay, firstOccurrence);
                const hasNotExpired = isBefore(currentDay, expirationDate);

                if (hasStarted && hasNotExpired) {
                    daySlots.push({
                        id: `${template.id}-${dateStr}`,
                        startTime: template.startTime,
                        endTime: template.endTime,
                        type: 'template',
                        isCancelled: false,
                        templateId: template.id
                    });
                }
            }
        });

        // 2. Process Overrides
        const dayOverrides = overrides.filter(o => o.date === dateStr);

        dayOverrides.forEach(override => {
            if (override.templateId) {
                const index = daySlots.findIndex(s => s.templateId === override.templateId);
                if (index !== -1) {
                    if (override.isCancelled) {
                        daySlots[index].isCancelled = true;
                    } else if (override.startTime && override.endTime) {
                        daySlots[index].startTime = override.startTime;
                        daySlots[index].endTime = override.endTime;
                    }
                }
            } else if (!override.isCancelled) {
                if (override.startTime && override.endTime) {
                    daySlots.push({
                        id: override.id,
                        startTime: override.startTime,
                        endTime: override.endTime,
                        type: 'manual',
                        isCancelled: false
                    });
                }
            }
        });

        return {
            date: dateStr,
            slots: daySlots
        };
    });
};
