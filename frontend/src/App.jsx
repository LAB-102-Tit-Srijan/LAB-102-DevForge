import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import TeacherDashboard from './pages/TeacherDashboard';
import VideoPage from './pages/VideoPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Navbar from './components/layout/Navbar';
import { Toaster } from './components/ui/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <motion.div key="landing" initial={{ opacity: 0, filter: 'blur(6px)', y: 8 }} animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }} exit={{ opacity: 0, filter: 'blur(6px)', y: -8 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}>
            <LandingPage />
          </motion.div>
        } />
        <Route path="/teacher" element={
          <motion.div key="teacher" initial={{ opacity: 0, filter: 'blur(6px)', y: 8 }} animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }} exit={{ opacity: 0, filter: 'blur(6px)', y: -8 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}>
            <TeacherDashboard />
          </motion.div>
        } />
        <Route path="/library" element={
          <motion.div key="library" initial={{ opacity: 0, filter: 'blur(6px)', y: 8 }} animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }} exit={{ opacity: 0, filter: 'blur(6px)', y: -8 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}>
            <VideoPage />
          </motion.div>
        } />
        <Route path="/library/:videoId" element={
          <motion.div key="library-id" initial={{ opacity: 0, filter: 'blur(6px)', y: 8 }} animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }} exit={{ opacity: 0, filter: 'blur(6px)', y: -8 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}>
            <VideoPage />
          </motion.div>
        } />
        <Route path="/video/:videoId" element={
          <motion.div key="video-id" initial={{ opacity: 0, filter: 'blur(6px)', y: 8 }} animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }} exit={{ opacity: 0, filter: 'blur(6px)', y: -8 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}>
            <VideoPage />
          </motion.div>
        } />
        <Route path="/analytics" element={
          <motion.div key="analytics" initial={{ opacity: 0, filter: 'blur(6px)', y: 8 }} animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }} exit={{ opacity: 0, filter: 'blur(6px)', y: -8 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}>
            <AnalyticsDashboard />
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen">
          <Navbar />
          <AnimatedRoutes />
          <Toaster />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
