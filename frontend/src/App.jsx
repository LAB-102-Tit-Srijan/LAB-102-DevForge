import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen" style={{ backgroundColor: '#070B14' }}>
          <Navbar />
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/teacher" element={<TeacherDashboard />} />
              <Route path="/library" element={<VideoPage />} />
              <Route path="/library/:videoId" element={<VideoPage />} />
              <Route path="/video/:videoId" element={<VideoPage />} /> {/* Backward compatibility */}
              <Route path="/analytics" element={<AnalyticsDashboard />} />
            </Routes>
          </AnimatePresence>
          <Toaster />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
