import { motion } from 'framer-motion';
import { BarChart3, Video, MessageSquare, Zap, Clock } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useQuery } from '@tanstack/react-query';
import { getAnalytics } from '../lib/api';

const AnalyticsDashboard = () => {
  const { data, isLoading } = useQuery({ queryKey: ['analytics'], queryFn: () => getAnalytics().then(r => r.data), refetchInterval: 10000 });
  const stats = data || { totalVideos: 0, totalQueries: 0, cacheHitRate: 0, avgResponseTime: 0 };
  const cards = [
    { label: 'Videos Processed', value: stats.totalVideos, icon: <Video className="w-6 h-6" />, color: 'from-primary to-indigo-400' },
    { label: 'Questions Asked', value: stats.totalQueries, icon: <MessageSquare className="w-6 h-6" />, color: 'from-accent to-cyan-300' },
    { label: 'Cache Hit Rate', value: `${stats.cacheHitRate}%`, icon: <Zap className="w-6 h-6" />, color: 'from-success to-emerald-300' },
    { label: 'Avg Response Time', value: `${stats.avgResponseTime}ms`, icon: <Clock className="w-6 h-6" />, color: 'from-warning to-amber-300' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-text-secondary">System performance and usage metrics.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card glass hover>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 text-white shadow-lg`}>{card.icon}</div>
                <p className="text-sm text-text-secondary mb-1">{card.label}</p>
                <p className="text-3xl font-bold text-text-primary">{isLoading ? '...' : card.value}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
