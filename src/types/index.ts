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
export interface JourneyStep {
  id: string;
  stage: string;
  activity: string;
  type: string;
  weight: string;
  hours: number;
}
