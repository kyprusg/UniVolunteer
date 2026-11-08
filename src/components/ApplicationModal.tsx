import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { VolunteerScoringService } from '../services/VolunteerScoringService';
import { useConfetti } from './Confetti';

export function ApplicationModal() {
  const selectedEventId = useStore((s) => s.selectedEventId);
  const setSelectedEventId = useStore((s) => s.setSelectedEventId);
  const events = useStore((s) => s.events);
  const applyToEvent = useStore((s) => s.applyToEvent);

  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const { fire } = useConfetti();

  const event = events.find((e) => e.id === selectedEventId);

  const close = () => {
    if (loading) return;
    setSelectedEventId(null);
    setAgreed(false);
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!event || !agreed || loading) return;
    setLoading(true);
    const res = await applyToEvent(event.id);
    setLoading(false);
    setResult(res);
    if (res.success) {
      fire();
      setTimeout(close, 2500);
    }
  };

  const accruedHours = event
    ? VolunteerScoringService.calculateAccruedHours(event.baseHours, event.category, false)
    : 0;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <AnimatePresence>
      {selectedEventId && event && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Header gradient */}
              <div className={`h-1.5 bg-gradient-to-r ${event.imageGradient}`} />

              <div className="p-6">
                {/* Title row */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Подтверждение участия</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Проверьте детали перед отправкой</p>
                  </div>
                  <button
                    onClick={close}
                    disabled={loading}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Success state */}
                <AnimatePresence mode="wait">
                  {result?.success ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6"
                    >
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle className="w-9 h-9 text-emerald-500" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1">Заявка отправлена!</h3>
                      <p className="text-slate-500 text-sm">Ожидайте подтверждения куратора</p>
                    </motion.div>
                  ) : result?.success === false ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6"
                    >
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="w-9 h-9 text-red-500" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1">Ошибка</h3>
                      <p className="text-slate-500 text-sm">{result.message}</p>
                      <button
                        onClick={() => setResult(null)}
                        className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                      >
                        Назад
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {/* Event summary card */}
                      <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-3">
                        <div className="flex items-start gap-3">
                          <span className={`mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${CATEGORY_COLORS[event.category]}`}>
                            {CATEGORY_LABELS[event.category]}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900">{event.title}</h3>
                        <div className="space-y-1.5 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {formatDate(event.date)}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            {event.location} · {event.campus}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            <span className="font-semibold text-indigo-700">
                              +{accruedHours} волонтёрских часов
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Checkbox */}
                      <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors mb-5">
                        <div className="relative mt-0.5">
                          <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                              agreed
                                ? 'bg-indigo-600 border-indigo-600'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {agreed && (
                              <motion.svg
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                className="w-3 h-3 text-white"
                                fill="none"
                                viewBox="0 0 12 12"
                              >
                                <motion.path
                                  d="M2 6l3 3 5-5"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </motion.svg>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            Готов соблюдать регламент мероприятия
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Подтверждаю своё участие и обязуюсь выполнить волонтёрские обязанности
                          </p>
                        </div>
                      </label>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={close}
                          className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={!agreed || loading}
                          className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                            agreed && !loading
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 hover:-translate-y-0.5'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Отправка...
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-4 h-4" />
                              Подтвердить
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
