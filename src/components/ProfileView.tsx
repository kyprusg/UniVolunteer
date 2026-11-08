import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  FolderOpen,
  Trophy,
  Leaf,
  Heart,
  ShieldCheck,
  Users,
  Zap,
  Lock,
  CheckCircle,
  XCircle,
  Hourglass,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types';

const BADGE_ICON_MAP: Record<string, React.ReactNode> = {
  Leaf: <Leaf className="w-5 h-5" />,
  Trophy: <Trophy className="w-5 h-5" />,
  Heart: <Heart className="w-5 h-5" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  Zap: <Zap className="w-5 h-5" />,
};

const STATUS_CONFIG = {
  PENDING: {
    label: 'Ждёт подтверждения',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Hourglass className="w-3.5 h-3.5" />,
  },
  CONFIRMED: {
    label: 'Часы начислены',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  REJECTED: {
    label: 'Отклонено',
    className: 'bg-red-50 text-red-700 border-red-200',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

function AnimatedNumber({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="tabular-nums"
    >
      {value}
    </motion.span>
  );
}

export function ProfileView() {
  const profile = useStore((s) => s.profile);
  const applications = useStore((s) => s.applications);
  const events = useStore((s) => s.events);
  const withdrawApplication = useStore((s) => s.withdrawApplication);

  const myApps = useMemo(
    () => applications.filter((a) => a.studentId === profile.id),
    [applications, profile.id]
  );

  const canWithdraw = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return false;
    const eventDate = new Date(event.date);
    const now = new Date();
    const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours >= 24;
  };

  const getEventForApp = (eventId: string) => events.find((e) => e.id === eventId);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Мой профиль</h2>
        <p className="text-slate-500 mt-1">Волонтёрская история и достижения</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200"
        >
          <div className="flex items-center gap-2 mb-3 opacity-80">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Волонтёрских часов</span>
          </div>
          <div className="text-5xl font-black">
            <AnimatedNumber value={profile.totalHours} />
          </div>
          <div className="text-sm mt-1 opacity-70">ч. всего</div>
        </motion.div>

        {/* Completed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3 text-slate-500">
            <FolderOpen className="w-4 h-4" />
            <span className="text-sm font-medium">Завершено проектов</span>
          </div>
          <div className="text-5xl font-black text-slate-900">
            <AnimatedNumber value={profile.completedProjects} />
          </div>
          <div className="text-sm mt-1 text-slate-400">проектов</div>
        </motion.div>

        {/* Rank */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3 text-slate-500">
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-medium">Текущий рейтинг</span>
          </div>
          <div className="text-5xl font-black text-slate-900">
            #<AnimatedNumber value={profile.rank} />
          </div>
          <div className="text-sm mt-1 text-slate-400">в рейтинге</div>
        </motion.div>
      </div>

      {/* Badges */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-base font-bold text-slate-900 mb-4">Достижения</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {profile.badges.map((badge, i) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all duration-200 ${
                badge.unlocked
                  ? 'bg-gradient-to-b from-indigo-50 to-white border-indigo-200 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                  : 'bg-slate-50 border-slate-200 opacity-60 grayscale'
              }`}
            >
              {!badge.unlocked && (
                <Lock className="absolute top-2 right-2 w-3 h-3 text-slate-400" />
              )}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  badge.unlocked ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'
                }`}
              >
                {BADGE_ICON_MAP[badge.icon] ?? <Trophy className="w-5 h-5" />}
              </div>
              <span className="text-xs font-semibold text-slate-700 leading-tight">
                {badge.name}
              </span>
              {/* Progress */}
              {!badge.unlocked && (
                <div className="w-full">
                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full transition-all"
                      style={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {badge.progress}/{badge.maxProgress}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* My Applications */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Мои заявки</h3>
          <p className="text-sm text-slate-400 mt-0.5">{myApps.length} заявок</p>
        </div>

        {myApps.length === 0 ? (
          <div className="p-10 text-center">
            <FolderOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">У вас пока нет заявок</p>
            <p className="text-slate-400 text-xs mt-1">Перейдите в каталог, чтобы подать заявку</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myApps.map((app) => {
              const event = getEventForApp(app.eventId);
              const statusCfg = STATUS_CONFIG[app.status];
              const withdrawable = app.status === 'PENDING' && canWithdraw(app.eventId);
              const tooLate = app.status === 'PENDING' && !canWithdraw(app.eventId);

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.className}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                      {event && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${CATEGORY_COLORS[event.category]}`}>
                          {CATEGORY_LABELS[event.category]}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-slate-900 truncate">
                      {event?.title ?? 'Мероприятие удалено'}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>
                        Подана: {new Date(app.appliedAt).toLocaleDateString('ru-RU')}
                      </span>
                      {app.status === 'CONFIRMED' && (
                        <span className="text-indigo-600 font-semibold">
                          +{app.accruedHours} ч
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Withdraw button */}
                  {withdrawable && (
                    <button
                      onClick={() => withdrawApplication(app.id)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                      Отозвать
                    </button>
                  )}
                  {tooLate && (
                    <div
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 bg-slate-50 rounded-lg cursor-not-allowed"
                      title="До начала осталось менее 24 часов"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Нельзя отозвать
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
