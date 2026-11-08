import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Filter,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  EventCategory,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  VolunteerEvent,
} from '../types';
import { VolunteerScoringService } from '../services/VolunteerScoringService';
import { ApplicationModal } from './ApplicationModal';

const FILTER_CATEGORIES: (EventCategory | 'ALL')[] = [
  'ALL',
  'ECOLOGY',
  'DONATION',
  'SOCIAL',
  'EMERGENCY',
];

const FILTER_LABELS: Record<EventCategory | 'ALL', string> = {
  ALL: 'Все',
  ECOLOGY: 'Экология',
  DONATION: 'Донорство',
  SOCIAL: 'Социальные',
  EMERGENCY: 'ЧС',
};

export function CatalogView() {
  const events = useStore((s) => s.events);
  const applications = useStore((s) => s.applications);
  const profile = useStore((s) => s.profile);
  const searchQuery = useStore((s) => s.searchQuery);
  const categoryFilter = useStore((s) => s.categoryFilter);
  const statusFilter = useStore((s) => s.statusFilter);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const setCategoryFilter = useStore((s) => s.setCategoryFilter);
  const setStatusFilter = useStore((s) => s.setStatusFilter);
  const setSelectedEventId = useStore((s) => s.setSelectedEventId);
  const selectedEventId = useStore((s) => s.selectedEventId);

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [shakeEventId, setShakeEventId] = useState<string | null>(null);

  // Debounced search
  useMemo(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Category filter
      if (categoryFilter !== 'ALL' && event.category !== categoryFilter) return false;

      // Status filter
      if (statusFilter === 'OPEN' && (event.currentVolunteers >= event.maxVolunteers || event.isClosed))
        return false;
      if (statusFilter === 'FULL' && event.currentVolunteers < event.maxVolunteers && !event.isClosed)
        return false;

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          event.title.toLowerCase().includes(q) ||
          event.description.toLowerCase().includes(q) ||
          event.tags.some((t) => t.toLowerCase().includes(q)) ||
          event.campus.toLowerCase().includes(q) ||
          event.organizer.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [events, categoryFilter, statusFilter, searchQuery]);

  const getButtonState = (event: VolunteerEvent) => {
    const hasApplied = applications.some(
      (a) => a.eventId === event.id && a.studentId === profile.id && a.status !== 'REJECTED'
    );
    const isFull = event.currentVolunteers >= event.maxVolunteers;
    const isClosed = event.isClosed;

    if (hasApplied) return 'applied';
    if (isFull || isClosed) return 'disabled';
    return 'default';
  };

  const handleApplyClick = (event: VolunteerEvent) => {
    const state = getButtonState(event);
    if (state === 'applied') {
      setShakeEventId(event.id);
      setTimeout(() => setShakeEventId(null), 600);
      return;
    }
    if (state === 'disabled') return;
    setSelectedEventId(event.id);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Каталог инициатив</h2>
        <p className="text-slate-500 mt-1">Выберите проект и станьте частью команды волонтёров</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Поиск по названию, тегам, кампусу..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTER_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {FILTER_LABELS[cat]}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-slate-200 hidden sm:block" />

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            {(['ALL', 'OPEN', 'FULL'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {status === 'ALL' ? 'Все' : status === 'OPEN' ? 'Открыт набор' : 'Мест нет'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Event Grid */}
      {filteredEvents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Search className="w-7 h-7 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">Ничего не найдено</h3>
          <p className="text-sm text-slate-400 mt-1">Попробуйте изменить параметры поиска</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((event, i) => {
            const btnState = getButtonState(event);
            const spotsLeft = event.maxVolunteers - event.currentVolunteers;
            const fillPercent = (event.currentVolunteers / event.maxVolunteers) * 100;
            const accruedHours = VolunteerScoringService.calculateAccruedHours(
              event.baseHours,
              event.category,
              false
            );

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className={`group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 ${
                  shakeEventId === event.id ? 'animate-shake' : ''
                }`}
              >
                {/* Gradient header */}
                <div
                  className={`h-2 bg-gradient-to-r ${event.imageGradient}`}
                />

                <div className="p-5">
                  {/* Badges row */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${CATEGORY_COLORS[event.category]}`}
                    >
                      {CATEGORY_LABELS[event.category]}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <Clock className="w-3 h-3 inline mr-0.5 -mt-0.5" />+{accruedHours} ч
                    </span>
                    {spotsLeft <= 3 && spotsLeft > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-100">
                        Мало мест!
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 leading-snug mb-2 line-clamp-2 group-hover:text-indigo-700 transition-colors">
                    {event.title}
                  </h3>

                  {/* Meta */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(event.date)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5" />
                      {event.location}
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-medium text-slate-600">
                        {event.campus}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Users className="w-3.5 h-3.5" />
                      {event.organizer}
                    </div>
                  </div>

                  {/* Capacity bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {event.currentVolunteers}/{event.maxVolunteers} занято
                      </span>
                      <span
                        className={`text-[11px] font-semibold ${
                          spotsLeft === 0 ? 'text-red-500' : spotsLeft <= 3 ? 'text-amber-500' : 'text-emerald-500'
                        }`}
                      >
                        {spotsLeft === 0 ? 'Мест нет' : `${spotsLeft} мест`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${fillPercent}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                        className={`h-full rounded-full ${
                          fillPercent >= 100
                            ? 'bg-red-400'
                            : fillPercent >= 70
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  {btnState === 'default' && (
                    <button
                      onClick={() => handleApplyClick(event)}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Откликнуться
                    </button>
                  )}
                  {btnState === 'applied' && (
                    <button
                      onClick={() => handleApplyClick(event)}
                      className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 text-sm font-semibold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                      title="Заявка уже отправлена"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Заявка отправлена
                    </button>
                  )}
                  {btnState === 'disabled' && (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 text-sm font-semibold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                      title={event.isClosed ? 'Набор закрыт' : 'Мест нет'}
                    >
                      {event.isClosed ? 'Набор закрыт' : 'Мест нет'}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Application Modal */}
      <ApplicationModal />
    </div>
  );
}
