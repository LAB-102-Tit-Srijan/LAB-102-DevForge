import { motion } from 'framer-motion';
import { BarChart3, Video, MessageSquare, Zap, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAnalytics } from '../lib/api';

const AnalyticsDashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => getAnalytics().then(r => r.data),
    refetchInterval: 10000,
  });

  const stats = data || { totalVideos: 0, totalQueries: 0, cacheHitRate: 0, avgResponseTime: 0 };

  const cards = [
    { label: 'Videos Processed', value: stats.totalVideos, icon: <Video className="w-6 h-6" /> },
    { label: 'Questions Asked', value: stats.totalQueries, icon: <MessageSquare className="w-6 h-6" /> },
    { label: 'Cache Hit Rate', value: `${stats.cacheHitRate}%`, icon: <Zap className="w-6 h-6" /> },
    { label: 'Avg Response Time', value: `${stats.avgResponseTime}ms`, icon: <Clock className="w-6 h-6" /> },
  ];

  return (
    <div className="min-h-screen relative" style={{ paddingTop: '120px', paddingBottom: '48px' }}>
      <div className="max-w-[1100px] mx-auto px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 rounded-[20px] bg-[var(--accent-muted)] flex items-center justify-center mx-auto mb-5">
            <BarChart3 className="w-8 h-8" style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-4xl font-bold mb-3 tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Insights</h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>System performance and usage metrics.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <div className="metric-card h-full">
                <div className="metric-icon">
                  {card.icon}
                </div>
                <p className="metric-label">{card.label}</p>
                <div className="metric-value">
                  {isLoading ? (
                    <div className="w-16 h-8 skeleton" />
                  ) : card.value}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
