export type EventCategory = 'EMERGENCY' | 'DONATION' | 'ECOLOGY' | 'SOCIAL';

export type ApplicationStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

export interface VolunteerEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  location: string;
  campus: string;
  organizer: string;
  baseHours: number;
  maxVolunteers: number;
  currentVolunteers: number;
  isClosed: boolean;
  tags: string[];
  imageGradient: string;
}

export interface Application {
  id: string;
  eventId: string;
  studentId: string;
  studentName: string;
  status: ApplicationStatus;
  appliedAt: string;
  accruedHours: number;
  isLead: boolean;
}

export interface StudentProfile {
  id: string;
  name: string;
  totalHours: number;
  completedProjects: number;
  rank: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: string;
  read: boolean;
}

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  EMERGENCY: 'ЧС',
  DONATION: 'Донорство',
  ECOLOGY: 'Экология',
  SOCIAL: 'Социальные',
};

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  EMERGENCY: 'bg-red-100 text-red-700 border-red-200',
  DONATION: 'bg-rose-100 text-rose-700 border-rose-200',
  ECOLOGY: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  SOCIAL: 'bg-blue-100 text-blue-700 border-blue-200',
};

export const CATEGORY_MULTIPLIERS: Record<EventCategory, number> = {
  EMERGENCY: 1.5,
  DONATION: 1.3,
  ECOLOGY: 1.1,
  SOCIAL: 1.0,
};
