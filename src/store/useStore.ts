import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  VolunteerEvent,
  Application,
  StudentProfile,
  Notification,
  ApplicationStatus,
  EventCategory,
} from '../types';
import { SEED_EVENTS, SEED_APPLICATIONS, SEED_BADGES } from '../data/seedData';
import { VolunteerScoringService } from '../services/VolunteerScoringService';

export type ViewMode = 'student' | 'curator';
export type Page = 'catalog' | 'profile' | 'curator' | 'tests';

interface AppState {
  // View
  viewMode: ViewMode;
  currentPage: Page;
  setViewMode: (mode: ViewMode) => void;
  setCurrentPage: (page: Page) => void;

  // Events
  events: VolunteerEvent[];
  addEvent: (event: Omit<VolunteerEvent, 'id' | 'currentVolunteers' | 'isClosed' | 'imageGradient'>) => void;

  // Applications
  applications: Application[];
  applyToEvent: (eventId: string) => Promise<{ success: boolean; message: string }>;
  withdrawApplication: (applicationId: string) => void;
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus) => void;

  // Profile
  profile: StudentProfile;

  // Notifications
  notifications: Notification[];
  addNotification: (message: string, type: Notification['type']) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Application modal
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;

  // Filters
  searchQuery: string;
  categoryFilter: EventCategory | 'ALL';
  statusFilter: 'ALL' | 'OPEN' | 'FULL';
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (cat: EventCategory | 'ALL') => void;
  setStatusFilter: (status: 'ALL' | 'OPEN' | 'FULL') => void;

  // Reset
  resetStore: () => void;
}

const GRADIENT_MAP: Record<EventCategory, string> = {
  ECOLOGY: 'from-emerald-500 to-teal-600',
  DONATION: 'from-rose-500 to-pink-600',
  EMERGENCY: 'from-red-500 to-orange-600',
  SOCIAL: 'from-blue-500 to-indigo-600',
};

const initialProfile: StudentProfile = {
  id: 'student-1',
  name: 'Даниил Волков',
  totalHours: 42,
  completedProjects: 7,
  rank: 3,
  badges: SEED_BADGES,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // View
      viewMode: 'student',
      currentPage: 'catalog',
      setViewMode: (mode) => {
        set({ viewMode: mode, currentPage: mode === 'curator' ? 'curator' : 'catalog' });
      },
      setCurrentPage: (page) => set({ currentPage: page }),

      // Events
      events: SEED_EVENTS,
      addEvent: (eventData) => {
        const id = `event-${Date.now()}`;
        const newEvent: VolunteerEvent = {
          ...eventData,
          id,
          currentVolunteers: 0,
          isClosed: false,
          imageGradient: GRADIENT_MAP[eventData.category] || 'from-gray-500 to-gray-600',
        };
        set((state) => ({
          events: [...state.events, newEvent],
        }));
        get().addNotification(`Инициатива «${eventData.title}» создана`, 'success');
      },

      // Applications
      applications: SEED_APPLICATIONS,
      applyToEvent: async (eventId: string) => {
        const state = get();
        const profile = state.profile;
        const event = state.events.find((e) => e.id === eventId);

        if (!event) {
          return { success: false, message: 'Мероприятие не найдено' };
        }

        // Check existing application
        const existingApp = state.applications.find(
          (a) => a.eventId === eventId && a.studentId === profile.id && a.status !== 'REJECTED'
        );
        if (existingApp) {
          return { success: false, message: 'Заявка уже отправлена' };
        }

        // Concurrency lock
        if (!VolunteerScoringService.acquireLock(eventId, profile.id)) {
          return { success: false, message: 'Повторная заявка заблокирована (конкуренция)' };
        }

        try {
          // Check capacity
          if (!VolunteerScoringService.canApply(event.currentVolunteers, event.maxVolunteers, event.isClosed)) {
            return { success: false, message: 'Мест нет' };
          }

          // Simulate async processing
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const accruedHours = VolunteerScoringService.calculateAccruedHours(
            event.baseHours,
            event.category,
            false
          );

          const newApp: Application = {
            id: `app-${Date.now()}`,
            eventId,
            studentId: profile.id,
            studentName: profile.name,
            status: 'PENDING',
            appliedAt: new Date().toISOString(),
            accruedHours,
            isLead: false,
          };

          set((state) => ({
            applications: [...state.applications, newApp],
            events: state.events.map((e) =>
              e.id === eventId
                ? { ...e, currentVolunteers: e.currentVolunteers + 1 }
                : e
            ),
          }));

          get().addNotification(
            `Заявка на «${event.title}» отправлена! Ожидайте подтверждения.`,
            'success'
          );

          return { success: true, message: 'Заявка успешно отправлена' };
        } finally {
          VolunteerScoringService.releaseLock(eventId, profile.id);
        }
      },

      withdrawApplication: (applicationId) => {
        const app = get().applications.find((a) => a.id === applicationId);
        if (!app) return;

        const event = get().events.find((e) => e.id === app.eventId);

        set((state) => ({
          applications: state.applications.filter((a) => a.id !== applicationId),
          events: state.events.map((e) =>
            e.id === app.eventId
              ? { ...e, currentVolunteers: Math.max(0, e.currentVolunteers - 1) }
              : e
          ),
        }));

        if (event) {
          get().addNotification(`Заявка на «${event.title}» отозвана`, 'info');
        }
      },

      updateApplicationStatus: (applicationId, status) => {
        const app = get().applications.find((a) => a.id === applicationId);
        if (!app) return;

        const event = get().events.find((e) => e.id === app.eventId);

        set((state) => ({
          applications: state.applications.map((a) =>
            a.id === applicationId ? { ...a, status } : a
          ),
        }));

        if (status === 'CONFIRMED' && app) {
          set((state) => ({
            profile: {
              ...state.profile,
              totalHours: Math.round((state.profile.totalHours + app.accruedHours) * 10) / 10,
              completedProjects: state.profile.completedProjects + 1,
            },
          }));
          get().addNotification(
            `Участие подтверждено: +${app.accruedHours} ч за «${event?.title}»`,
            'success'
          );
        } else if (status === 'REJECTED') {
          set((state) => ({
            events: state.events.map((e) =>
              e.id === app.eventId
                ? { ...e, currentVolunteers: Math.max(0, e.currentVolunteers - 1) }
                : e
            ),
          }));
          get().addNotification(`Заявка на «${event?.title}» отклонена`, 'warning');
        }
      },

      // Profile
      profile: initialProfile,

      // Notifications
      notifications: [],
      addNotification: (message, type) => {
        const notification: Notification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          message,
          type,
          timestamp: new Date().toISOString(),
          read: false,
        };
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 50),
        }));
      },
      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },
      clearNotifications: () => set({ notifications: [] }),

      // Application modal
      selectedEventId: null,
      setSelectedEventId: (id) => set({ selectedEventId: id }),

      // Filters
      searchQuery: '',
      categoryFilter: 'ALL',
      statusFilter: 'ALL',
      setSearchQuery: (query) => set({ searchQuery: query }),
      setCategoryFilter: (cat) => set({ categoryFilter: cat }),
      setStatusFilter: (status) => set({ statusFilter: status }),

      // Reset
      resetStore: () =>
        set({
          events: SEED_EVENTS,
          applications: SEED_APPLICATIONS,
          profile: initialProfile,
          notifications: [],
          viewMode: 'student',
          currentPage: 'catalog',
          searchQuery: '',
          categoryFilter: 'ALL',
          statusFilter: 'ALL',
          selectedEventId: null,
        }),
    }),
    {
      name: 'univolunteer-storage',
      partialize: (state) => ({
        events: state.events,
        applications: state.applications,
        profile: state.profile,
        notifications: state.notifications,
        viewMode: state.viewMode,
        currentPage: state.currentPage,
      }),
    }
  )
);
export const Page = {} as any;
export const ViewMode = {} as any;