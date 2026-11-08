import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  User,
  X,
  Loader2,
  ClipboardList,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { CATEGORY_LABELS, CATEGORY_COLORS, EventCategory } from '../types';
import { VolunteerScoringService } from '../services/VolunteerScoringService';

const CATEGORIES: EventCategory[] = ['ECOLOGY', 'DONATION', 'EMERGENCY', 'SOCIAL'];

interface NewEventForm {
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  campus: string;
  location: string;
  organizer: string;
  baseHours: number;
  maxVolunteers: number;
  tags: string;
}

const defaultForm: NewEventForm = {
  title: '',
  description: '',
  category: 'SOCIAL',
  date: '',
  campus: '',
  location: '',
  organizer: '',
  baseHours: 4,
  maxVolunteers: 10,
  tags: '',
};

export function CuratorDashboard() {
  const events = useStore((s) => s.events);
  const applications = useStore((s) => s.applications);
  const addEvent = useStore((s) => s.addEvent);
  const updateApplicationStatus = useStore((s) => s.updateApplicationStatus);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<NewEventForm>(defaultForm);
  const [errors, setErrors] = useState<Partial<NewEventForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const pendingApps = applications.filter((a) => a.status === 'PENDING');

  const validate = (): boolean => {
    const e: Partial<NewEventForm> = {};
    if (!form.title.trim()) e.title = 'Введите название';
    if (!form.description.trim()) e.description = 'Введите описание';
    if (!form.date) e.date = 'Выберите дату';
    if (!form.campus.trim()) e.campus = 'Укажите кампус';
    if (!form.location.trim()) e.location = 'Укажите место';
    if (!form.organizer.trim()) e.organizer = 'Укажите организатора';
    if (form.baseHours < 1) e.baseHours = 1 as any;
    if (form.maxVolunteers < 1) e.maxVolunteers = 1 as any;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    addEvent({
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      date: form.date,
      campus: form.campus.trim(),
      location: form.location.trim(),
      organizer: form.organizer.trim(),
      baseHours: Number(form.baseHours),
      maxVolunteers: Number(form.maxVolunteers),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setSubmitting(false);
    setShowCreateModal(false);
    setForm(defaultForm);
    setErrors({});
  };

  const handleApprove = async (appId: string) => {
    setApprovingId(appId);
    await new Promise((r) => setTimeout(r, 500));
    updateApplicationStatus(appId, 'CONFIRMED');
    setApprovingId(null);
  };

  const handleReject = (appId: string) => {
    updateApplicationStatus(appId, 'REJECTED');
  };

  const getEventForApp = (eventId: string) => events.find((e) => e.id === eventId);

  const field = (key: keyof NewEventForm) => ({
    value: form[key] as string | number,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
  });

  const inputCls = (key: keyof NewEventForm) =>
    `w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all ${
      errors[key] ? 'border-red-300 bg-red-50' : 'border-slate-200'
    }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Панель куратора</h2>
          <p className="text-slate-500 mt-1">Управление инициативами и заявками студентов</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          Создать инициативу
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Всего мероприятий', value: events.length, icon: <ClipboardList className="w-4 h-4" /> },
          { label: 'Ожидают подтверждения', value: pendingApps.length, icon: <Clock className="w-4 h-4" />, highlight: pendingApps.length > 0 },
          { label: 'Подтверждено', value: applications.filter((a) => a.status === 'CONFIRMED').length, icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Отклонено', value: applications.filter((a) => a.status === 'REJECTED').length, icon: <XCircle className="w-4 h-4" /> },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-white rounded-xl p-4 border shadow-sm ${
              stat.highlight ? 'border-amber-200 bg-amber-50' : 'border-slate-200'
            }`}
          >
            <div className={`flex items-center gap-1.5 mb-2 text-xs font-medium ${stat.highlight ? 'text-amber-600' : 'text-slate-500'}`}>
              {stat.icon}
              {stat.label}
            </div>
            <div className={`text-3xl font-black ${stat.highlight ? 'text-amber-700' : 'text-slate-900'}`}>
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pending Applications */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Заявки на рассмотрении</h3>
            <p className="text-xs text-slate-400 mt-0.5">{pendingApps.length} ожидают ответа</p>
          </div>
          {pendingApps.length > 0 && (
            <span className="w-6 h-6 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {pendingApps.length}
            </span>
          )}
        </div>

        {pendingApps.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Все заявки обработаны</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingApps.map((app) => {
              const event = getEventForApp(app.eventId);
              const hrs = VolunteerScoringService.calculateAccruedHours(
                event?.baseHours ?? 0,
                event?.category ?? 'SOCIAL',
                false
              );
              const isLoading = approvingId === app.id;

              return (
                <motion.div
                  key={app.id}
                  layout
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  {/* Student info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{app.studentName}</p>
                      <p className="text-xs text-slate-500">ID: {app.studentId}</p>
                    </div>
                  </div>

                  {/* Event info */}
                  <div className="flex-1 min-w-0">
                    {event && (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${CATEGORY_COLORS[event.category]} mb-1`}>
                        {CATEGORY_LABELS[event.category]}
                      </span>
                    )}
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {event?.title ?? 'Мероприятие'}
                    </p>
                    <p className="text-xs text-indigo-600 font-semibold mt-0.5">+{hrs} ч при подтверждении</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(app.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-all hover:-translate-y-0.5 shadow-sm shadow-emerald-200 disabled:opacity-60 disabled:cursor-wait"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      Одобрить
                    </button>
                    <button
                      onClick={() => handleReject(app.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-semibold rounded-lg transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Отклонить
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Events list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Все мероприятия</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {events.map((event) => {
            const eventApps = applications.filter((a) => a.eventId === event.id);
            return (
              <div key={event.id} className="p-4 flex items-center gap-4">
                <div className={`w-2 h-10 rounded-full bg-gradient-to-b ${event.imageGradient} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{event.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${CATEGORY_COLORS[event.category]}`}>
                      {CATEGORY_LABELS[event.category]}
                    </span>
                    <span>{event.campus}</span>
                    <span>·</span>
                    <span>{new Date(event.date).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {event.currentVolunteers}/{event.maxVolunteers}
                  </div>
                  <div className="flex items-center gap-1">
                    <ClipboardList className="w-3.5 h-3.5" />
                    {eventApps.length} заявок
                  </div>
                  {event.isClosed && (
                    <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-medium rounded border border-red-200">
                      Закрыт
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setShowCreateModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-slate-900">Новая инициатива</h2>
                    <button
                      onClick={() => !submitting && setShowCreateModal(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Название *</label>
                      <input {...field('title')} className={inputCls('title')} placeholder="Субботник в парке..." />
                      {errors.title && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Описание *</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => { setForm((f) => ({ ...f, description: e.target.value })); if (errors.description) setErrors((p) => ({ ...p, description: undefined })); }}
                        rows={3}
                        className={inputCls('description')}
                        placeholder="Подробное описание мероприятия..."
                      />
                      {errors.description && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.description}</p>}
                    </div>

                    {/* Category + Date */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Категория *</label>
                        <select
                          value={form.category}
                          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as EventCategory }))}
                          className={inputCls('category')}
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Дата *</label>
                        <input type="date" {...field('date')} className={inputCls('date')} />
                        {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                      </div>
                    </div>

                    {/* Campus + Location */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Кампус *</label>
                        <input {...field('campus')} className={inputCls('campus')} placeholder="МГУ, ИТМО..." />
                        {errors.campus && <p className="text-xs text-red-500 mt-1">{errors.campus}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Место *</label>
                        <input {...field('location')} className={inputCls('location')} placeholder="Парк, аудитория..." />
                        {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
                      </div>
                    </div>

                    {/* Organizer */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Организатор *</label>
                      <input {...field('organizer')} className={inputCls('organizer')} placeholder="Студсовет, НКО..." />
                      {errors.organizer && <p className="text-xs text-red-500 mt-1">{errors.organizer}</p>}
                    </div>

                    {/* Hours + Capacity */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Базовые часы *</label>
                        <input
                          type="number"
                          min={1}
                          max={24}
                          value={form.baseHours}
                          onChange={(e) => setForm((f) => ({ ...f, baseHours: Number(e.target.value) }))}
                          className={inputCls('baseHours')}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Макс. волонтёров *</label>
                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={form.maxVolunteers}
                          onChange={(e) => setForm((f) => ({ ...f, maxVolunteers: Number(e.target.value) }))}
                          className={inputCls('maxVolunteers')}
                        />
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Теги (через запятую)</label>
                      <input {...field('tags')} className={inputCls('tags')} placeholder="экология, уборка, парк..." />
                    </div>
                  </div>

                  {/* Preview hours */}
                  <div className="mt-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center gap-2 text-sm text-indigo-700">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>
                      Начислено: <strong>+{VolunteerScoringService.calculateAccruedHours(form.baseHours || 0, form.category, false)} ч</strong> (обычный) / <strong>+{VolunteerScoringService.calculateAccruedHours(form.baseHours || 0, form.category, true)} ч</strong> (лидер)
                    </span>
                  </div>

                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => !submitting && setShowCreateModal(false)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={submitting}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-200 disabled:opacity-70"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      {submitting ? 'Создание...' : 'Создать'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
