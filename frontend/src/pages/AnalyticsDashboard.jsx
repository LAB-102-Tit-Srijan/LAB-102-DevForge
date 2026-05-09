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
    { label: 'Videos Processed', value: stats.totalVideos, icon: <Video className="w-6 h-6" />, gradient: 'from-coral to-coral-light' },
    { label: 'Questions Asked', value: stats.totalQueries, icon: <MessageSquare className="w-6 h-6" />, gradient: 'from-coral-light to-coral' },
    { label: 'Cache Hit Rate', value: `${stats.cacheHitRate}%`, icon: <Zap className="w-6 h-6" />, gradient: 'from-success to-emerald-300' },
    { label: 'Avg Response Time', value: `${stats.avgResponseTime}ms`, icon: <Clock className="w-6 h-6" />, gradient: 'from-warning to-amber-300' },
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
          <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-coral to-coral-light flex items-center justify-center mx-auto mb-5 shadow-lg shadow-coral-glow">
            <BarChart3 className="w-8 h-8 text-bg-app" />
          </div>
          <h1 className="text-4xl font-bold mb-3 tracking-tight">Insights</h1>
          <p className="text-text-secondary text-lg">System performance and usage metrics.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <div className="rounded-[24px] bg-bg-card border border-border-default p-6 card-shadow transition-all duration-300 hover:border-border-strong hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                style={{ minHeight: '140px' }}
              >
                <div className={`w-12 h-12 rounded-[14px] bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 text-bg-app shadow-lg`}>
                  {card.icon}
                </div>
                <p className="text-[13px] text-text-muted mb-1.5 font-medium tracking-wide">{card.label}</p>
                <p className="text-3xl font-bold text-text-primary tracking-tight">
                  {isLoading ? (
                    <span className="inline-block w-16 h-8 skeleton" />
                  ) : card.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
