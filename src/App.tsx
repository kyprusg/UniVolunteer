import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FlaskConical } from 'lucide-react';
import { useStore } from './store/useStore';
import { Header } from './components/Header';
import { CatalogView } from './components/CatalogView';
import { ProfileView } from './components/ProfileView';
import { CuratorDashboard } from './components/CuratorDashboard';
import { TestRunner } from './components/TestRunner';
import { ToastContainer } from './components/Toast';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function PageContent() {
  const currentPage = useStore((s) => s.currentPage);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPage}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {currentPage === 'catalog' && <CatalogView />}
        {currentPage === 'profile' && <ProfileView />}
        {currentPage === 'curator' && <CuratorDashboard />}
        {currentPage === 'tests' && <TestRunner />}
      </motion.div>
    </AnimatePresence>
  );
}

function useDevMode() {
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    const checkDevParam = () => {
      const params = new URLSearchParams(window.location.search);
      setIsDev(params.get('dev') === 'true');
    };
    checkDevParam();
    window.addEventListener('popstate', checkDevParam);
    return () => window.removeEventListener('popstate', checkDevParam);
  }, []);

  return isDev;
}

export default function App() {
  const isDev = useDevMode();
  const setCurrentPage = useStore((s) => s.setCurrentPage);
  const currentPage = useStore((s) => s.currentPage);

  // If user navigated to 'tests' page without dev mode, redirect to catalog
  useEffect(() => {
    if (currentPage === 'tests' && !isDev) {
      setCurrentPage('catalog');
    }
  }, [currentPage, isDev, setCurrentPage]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <PageContent />
      </main>
      <ToastContainer />

      {/* Hidden dev footer button — visible only with ?dev=true */}
      {isDev && (
        <footer className="w-full border-t border-slate-200/60 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-end">
            <button
              onClick={() => setCurrentPage('tests')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Стенд тестов ядра"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Стенд тестов ядра
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
