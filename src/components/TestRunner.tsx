import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Play, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { VolunteerScoringService } from '../services/VolunteerScoringService';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

interface TestCase {
  name: string;
  description: string;
  run: () => TestResult;
}

function runTest(name: string, description: string, fn: () => void): TestResult {
  const start = performance.now();
  try {
    fn();
    return { name, passed: true, message: description + ' — OK', duration: Math.round(performance.now() - start) };
  } catch (err: any) {
    return { name, passed: false, message: err?.message ?? 'Неизвестная ошибка', duration: Math.round(performance.now() - start) };
  }
}

function assertEquals<T>(actual: T, expected: T, msg?: string): void {
  if (actual !== expected) {
    throw new Error(msg ?? `Ожидалось ${JSON.stringify(expected)}, получено ${JSON.stringify(actual)}`);
  }
}
function assertThrows(fn: () => void, msgContains?: string): void {
  let threw = false;
  try { fn(); } catch (e: any) {
    threw = true;
    if (msgContains && !e.message?.includes(msgContains)) {
      throw new Error(`Ожидалась ошибка с текстом "${msgContains}", получено: "${e.message}"`);
    }
  }
  if (!threw) throw new Error('Ожидалась ошибка, но исключение не выброшено');
}

const TEST_SUITE: TestCase[] = [
  {
    name: 'Базовый расчёт часов (SOCIAL, 1.0x)',
    description: 'calculateAccruedHours(5, SOCIAL, false) → 5.0',
    run: () => runTest('Базовый расчёт часов', 'calculateAccruedHours(5, SOCIAL, false) → 5.0', () => {
      assertEquals(VolunteerScoringService.calculateAccruedHours(5, 'SOCIAL', false), 5.0);
    }),
  },
  {
    name: 'Мультипликаторы категорий',
    description: 'ECOLOGY×1.1, DONATION×1.3, EMERGENCY×1.5',
    run: () => runTest('Мультипликаторы категорий', 'Проверка всех коэффициентов', () => {
      assertEquals(VolunteerScoringService.calculateAccruedHours(10, 'ECOLOGY', false), 11.0);
      assertEquals(VolunteerScoringService.calculateAccruedHours(10, 'DONATION', false), 13.0);
      assertEquals(VolunteerScoringService.calculateAccruedHours(10, 'EMERGENCY', false), 15.0);
    }),
  },
  {
    name: 'Бонус лидера команды +2 ч',
    description: 'calculateAccruedHours(4, ECOLOGY, true) → 4.4 + 2 = 6.4',
    run: () => runTest('Бонус лидера команды', 'calculateAccruedHours(4, ECOLOGY, true) → 6.4', () => {
      assertEquals(VolunteerScoringService.calculateAccruedHours(4, 'ECOLOGY', true), 6.4);
      assertEquals(VolunteerScoringService.calculateAccruedHours(5, 'SOCIAL', true), 7.0);
    }),
  },
  {
    name: 'Ошибка при отрицательных часах',
    description: 'calculateAccruedHours(-1, ...) → Error',
    run: () => runTest('Отрицательные часы — ошибка', 'Должна выброситься ошибка', () => {
      assertThrows(() => VolunteerScoringService.calculateAccruedHours(-1, 'SOCIAL', false), 'negative');
      assertThrows(() => VolunteerScoringService.calculateAccruedHours(-0.1, 'ECOLOGY', true));
    }),
  },
  {
    name: 'canApply — проверка вместимости и статуса',
    description: 'currentCount >= maxCapacity или isClosed → false',
    run: () => runTest('Проверка доступности', 'Граничные значения вместимости', () => {
      assertEquals(VolunteerScoringService.canApply(5, 10, false), true);
      assertEquals(VolunteerScoringService.canApply(10, 10, false), false);
      assertEquals(VolunteerScoringService.canApply(11, 10, false), false);
      assertEquals(VolunteerScoringService.canApply(0, 10, true), false);
      assertEquals(VolunteerScoringService.canApply(0, 10, false), true);
    }),
  },
  {
    name: 'Mutex-блокировка двойных заявок',
    description: 'acquireLock → true; повторный → false; releaseLock → снова true',
    run: () => runTest('Mutex-блокировка', 'Имитация race condition', () => {
      VolunteerScoringService.clearAllLocks();
      const acquired1 = VolunteerScoringService.acquireLock('ev-test', 'st-test');
      assertEquals(acquired1, true, 'Первый захват должен вернуть true');
      const acquired2 = VolunteerScoringService.acquireLock('ev-test', 'st-test');
      assertEquals(acquired2, false, 'Повторный захват должен вернуть false');
      VolunteerScoringService.releaseLock('ev-test', 'st-test');
      const acquired3 = VolunteerScoringService.acquireLock('ev-test', 'st-test');
      assertEquals(acquired3, true, 'После освобождения блокировка должна быть доступна');
      VolunteerScoringService.releaseLock('ev-test', 'st-test');
    }),
  },
  {
    name: 'Округление до 1 знака после запятой',
    description: 'calculateAccruedHours(3, ECOLOGY, false) → 3.3 (не 3.30000...)',
    run: () => runTest('Точность округления', 'Математическое округление', () => {
      const result = VolunteerScoringService.calculateAccruedHours(3, 'ECOLOGY', false);
      assertEquals(result, 3.3);
      const result2 = VolunteerScoringService.calculateAccruedHours(1, 'DONATION', false);
      assertEquals(result2, 1.3);
      const result3 = VolunteerScoringService.calculateAccruedHours(2, 'EMERGENCY', false);
      assertEquals(result3, 3.0);
    }),
  },
];

export function TestRunner() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const runAll = async () => {
    setRunning(true);
    setResults([]);
    setHasRun(true);

    const collected: TestResult[] = [];
    for (const tc of TEST_SUITE) {
      await new Promise((r) => setTimeout(r, 160));
      const res = tc.run();
      collected.push(res);
      setResults([...collected]);
    }
    setRunning(false);
  };

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Тест-раннер</h2>
        <p className="text-slate-500 mt-1">
          Юнит-тесты бизнес-логики <code className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-sm">VolunteerScoringService</code>
        </p>
      </div>

      {/* Controls + summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <button
            onClick={runAll}
            disabled={running}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-200 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-wait"
          >
            {running ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Выполняется...</>
            ) : (
              <><Play className="w-4 h-4" />Запустить все тесты</>
            )}
          </button>

          {hasRun && !running && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${
                passed === total ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                {passed === total ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                {passed}/{total} прошло
              </div>
              <div className="text-sm text-slate-500">
                Время: {results.reduce((s, r) => s + (r.duration ?? 0), 0)} мс
              </div>
            </motion.div>
          )}
        </div>

        {/* Progress bar */}
        {hasRun && (
          <div className="mt-4">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${total > 0 ? (passed / TEST_SUITE.length) * 100 : 0}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${passed === total && !running ? 'bg-emerald-500' : 'bg-indigo-500'}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Test cards */}
      <div className="space-y-2">
        {TEST_SUITE.map((tc, i) => {
          const result = results[i];
          const isRunning = running && i === results.length;
          const isExp = expanded === i;

          return (
            <motion.div
              key={tc.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`bg-white rounded-xl border overflow-hidden shadow-sm transition-all ${
                result
                  ? result.passed
                    ? 'border-emerald-200'
                    : 'border-red-300'
                  : isRunning
                  ? 'border-indigo-300'
                  : 'border-slate-200'
              }`}
            >
              <button
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => result && setExpanded(isExp ? null : i)}
              >
                {/* Status icon */}
                <div className="shrink-0 w-7 h-7 flex items-center justify-center">
                  {isRunning ? (
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  ) : result ? (
                    result.passed ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      </motion.div>
                    ) : (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <XCircle className="w-5 h-5 text-red-500" />
                      </motion.div>
                    )
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
                  )}
                </div>

                {/* Name + desc */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${
                    result ? (result.passed ? 'text-slate-900' : 'text-red-700') : 'text-slate-500'
                  }`}>
                    {tc.name}
                  </p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{tc.description}</p>
                </div>

                {/* Duration */}
                {result && (
                  <div className="shrink-0 flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {result.duration}ms
                  </div>
                )}

                {/* Expand arrow */}
                {result && (
                  <div className="shrink-0 text-slate-400">
                    {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                )}
              </button>

              {/* Detail panel */}
              <AnimatePresence>
                {isExp && result && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`border-t text-xs font-mono px-4 py-3 overflow-hidden ${
                      result.passed ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'
                    }`}
                  >
                    {result.passed ? '✅ ' : '❌ '}
                    {result.message}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Empty state */}
      {!hasRun && (
        <div className="text-center py-8">
          <FlaskConical className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Нажмите «Запустить все тесты», чтобы начать</p>
        </div>
      )}
    </div>
  );
}
