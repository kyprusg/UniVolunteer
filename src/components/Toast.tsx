import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';

const ICON_MAP = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLOR_MAP = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
};

const ICON_COLOR_MAP = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-amber-500',
};

export function ToastContainer() {
  const notifications = useStore((s) => s.notifications);
  const [visible, setVisible] = useState<string[]>([]);

  useEffect(() => {
    const latest = notifications.filter((n) => !n.read).slice(0, 3);
    const newIds = latest.map((n) => n.id).filter((id) => !visible.includes(id));
    if (newIds.length > 0) {
      setVisible((prev) => [...newIds, ...prev].slice(0, 5));
    }
  }, [notifications]);

  const dismiss = useCallback((id: string) => {
    setVisible((prev) => prev.filter((v) => v !== id));
  }, []);

  useEffect(() => {
    const timers = visible.map((id) =>
      setTimeout(() => dismiss(id), 4000)
    );
    return () => timers.forEach(clearTimeout);
  }, [visible, dismiss]);

  const visibleNotifs = notifications.filter((n) => visible.includes(n.id));

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {visibleNotifs.map((notif) => {
          const Icon = ICON_MAP[notif.type];
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm ${COLOR_MAP[notif.type]}`}
            >
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${ICON_COLOR_MAP[notif.type]}`} />
              <p className="text-sm font-medium flex-1">{notif.message}</p>
              <button
                onClick={() => dismiss(notif.id)}
                className="shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
