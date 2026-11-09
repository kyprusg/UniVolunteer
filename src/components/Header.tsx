import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Bell,
  User,
  LayoutGrid,
  ClipboardList,
  RotateCcw,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import type { ViewMode, Page } from '../store/useStore';

export function Header() {
  const viewMode = useStore((s) => s.viewMode);
  const currentPage = useStore((s) => s.currentPage);
  const setViewMode = useStore((s) => s.setViewMode);
  const setCurrentPage = useStore((s) => s.setCurrentPage);
  const notifications = useStore((s) => s.notifications);
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const clearNotifications = useStore((s) => s.clearNotifications);
  const resetStore = useStore((s) => s.resetStore);

  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems: { page: Page; label: string; icon: React.ReactNode; modes: ViewMode[] }[] = [
    { page: 'catalog', label: 'Каталог', icon: <LayoutGrid className="w-4 h-4" />, modes: ['student'] },
    { page: 'profile', label: 'Профиль', icon: <User className="w-4 h-4" />, modes: ['student'] },
    { page: 'curator', label: 'Панель куратора', icon: <ClipboardList className="w-4 h-4" />, modes: ['curator'] },
  ];

  const visibleNavItems = navItems.filter((item) => item.modes.includes(viewMode));

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">UniVolunteer</h1>
              <p className="text-[10px] text-slate-400 leading-tight -mt-0.5">Платформа координации</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {visibleNavItems.map((item) => (
              <button
                key={item.page}
                onClick={() => setCurrentPage(item.page)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentPage === item.page
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Role Switcher */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('student')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                  viewMode === 'student'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Студент
              </button>
              <button
                onClick={() => setViewMode('curator')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                  viewMode === 'curator'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Куратор
              </button>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-3 border-b border-slate-100">
                      <h3 className="text-sm font-semibold text-slate-900">Уведомления</h3>
                      <button
                        onClick={() => {
                          clearNotifications();
                          setShowNotifications(false);
                        }}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        Очистить
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-sm text-slate-400 text-center">Нет уведомлений</p>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <button
                            key={n.id}
                            onClick={() => markNotificationRead(n.id)}
                            className={`w-full text-left p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                              n.read ? 'opacity-60' : ''
                            }`}
                          >
                            <p className="text-sm text-slate-700">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(n.timestamp).toLocaleString('ru-RU')}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reset */}
            <button
              onClick={resetStore}
              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Сбросить данные"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto">
          {visibleNavItems.map((item) => (
            <button
              key={item.page}
              onClick={() => setCurrentPage(item.page)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                currentPage === item.page
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
