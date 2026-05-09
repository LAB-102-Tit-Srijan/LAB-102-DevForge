import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Trash2, Film, Clock, Loader2, FileVideo } from 'lucide-react';
import { motion } from 'framer-motion';
import { deleteVideo, getVideos } from '../../lib/api';

const VideoSidebar = ({ currentVideoId }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: videos, isLoading, error } = useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      const { data } = await getVideos();
      return data;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!Array.isArray(data)) return 30000;
      const hasProcessing = data.some(v => v.processingStatus !== 'ready' && v.processingStatus !== 'failed');
      return hasProcessing ? 5000 : 30000;
    },
    placeholderData: (previousData) => previousData,
    retry: 2, // Only retry twice so we see the error quickly
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await deleteVideo(id);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      if (currentVideoId === deletedId) {
        navigate('/library');
      }
    },
  });

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-red-400">
        <p className="text-sm font-medium mb-2">Connection Error</p>
        <p className="text-xs opacity-80">{error.message}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-[11px] transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-text-muted">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        <p className="text-sm">Loading library...</p>
      </div>
    );
  }

  return (
    <div className="video-sidebar">
      <div className="sidebar-label">Your Library</div>

      <div className="flex flex-col gap-2">
        {videos?.length === 0 ? (
          <p className="text-sm text-center mt-6" style={{ color: 'var(--text-muted)' }}>No videos uploaded yet.</p>
        ) : (
          videos?.map((video) => {
            const isActive = currentVideoId === video.videoId;
            const status = video.processingStatus || video.status;
            const isReady = status === 'ready';
            const isFailed = status === 'failed';

            return (
              <motion.div
                key={video.videoId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`video-card group ${isActive ? 'active' : ''}`}
                onClick={() => navigate(`/library/${video.videoId}`)}
              >
                <div className="relative w-24 h-16 rounded-[6px] overflow-hidden bg-black flex-shrink-0 border border-border-default">
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}
                  {video.duration > 0 && (
                    <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-medium text-white flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 h-16">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {video.title || 'Untitled Video'}
                    </h3>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this video?')) deleteMutation.mutate(video.videoId);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all"
                      style={{ color: 'var(--text-muted)', hover: { color: 'var(--error)' } }}
                    >
                      <Trash2 className="w-3.5 h-3.5 hover:text-[var(--error)]" />
                    </button>
                  </div>
                  
                  <div className="mt-auto flex items-center gap-2">
                    {isReady ? (
                      <span className="status-badge ready">Ready</span>
                    ) : isFailed ? (
                      <span className="status-badge" style={{ background: 'var(--accent-muted)', color: 'var(--error)', borderColor: 'rgba(190, 18, 60, 0.3)' }}>Failed</span>
                    ) : (
                      <span className="status-badge processing animate-pulse">{status}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VideoSidebar;
