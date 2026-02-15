export type Role = 'ADMIN' | 'MANAGER' | 'MENTOR' | 'COACH' | 'ADVISOR' | 'ENTREPRENEUR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface AvailabilityTemplate {
  id: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string;
  endTime: string;
  weeksCount: number;
  startDate?: string; // YYYY-MM-DD
}

export interface AvailabilityOverride {
  id: string;
  date: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  isCancelled: boolean;
  templateId?: string;
}

export interface DayAvailability {
  date: string;
  slots: {
    id: string;
    startTime: string;
    endTime: string;
    type: 'template' | 'manual';
    isCancelled: boolean;
    templateId?: string;
  }[];
}
export interface Company {
  id: string; // Unique ID (e.g., EMP-001)
  name: string; // Razón social
  nit: string;
  email: string;
  phone: string;
  address: string;
}

export interface JourneyStep {
  id: string; // Código
  fase: string;
  stage: string; // Etapa
  month: string; // Mes
  type: string; // Tipo
  hours: number; // Horas (h)
  additional: string; // Adicional
  description: string; // Descripción de la actividad
  deliverable: string; // Entregable
  cohort1: {
    week: string;
    startDate: string;
    month: string;
  };
  cohort2: {
    week: string;
    startDate: string;
    month: string;
  };
}
