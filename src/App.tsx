import { AnimatePresence, motion } from 'framer-motion';
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

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <PageContent />
      </main>
      <ToastContainer />
    </div>
  );
}
