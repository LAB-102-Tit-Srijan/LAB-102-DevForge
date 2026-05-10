import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import ReactPlayer from 'react-player';
import { MessageSquare, BookOpen, HelpCircle, FileVideo, Upload as UploadIcon, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import ChatPanel from '../components/chat/ChatPanel';
import SummaryPanel from '../components/summary/SummaryPanel';
import QuizPanel from '../components/quiz/QuizPanel';
import VideoSidebar from '../components/library/VideoSidebar';
import useChatStore from '../store/chatStore';
import Button from '../components/ui/Button';
import { getVideo } from '../lib/api';

const VideoPage = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { setActiveVideo } = useChatStore();

  useEffect(() => {
    setActiveVideo(videoId || null);
  }, [videoId, setActiveVideo]);

  const { data: video, isLoading, error } = useQuery({
    queryKey: ['video', videoId],
    queryFn: async () => {
      if (!videoId) return null;
      const { data } = await getVideo(videoId);
      return data;
    },
    enabled: !!videoId,
    refetchInterval: (query) => {
      const data = query.state.data;
      const status = data?.processingStatus || data?.status;
      return (status !== 'ready' && status !== 'failed') ? 3000 : false;
    },
    placeholderData: (previousData) => previousData,
    retry: 1,
  });

  const seekToTimestamp = useCallback((seconds) => {
    if (playerRef.current) {
      if (playerRef.current.tagName === 'IFRAME') {
        playerRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }), '*');
        playerRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
      } else if (typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(seconds, 'seconds'); // ReactPlayer
      } else {
        playerRef.current.currentTime = seconds; // Native video
        playerRef.current.play().catch(() => { });
      }
    }
  }, []);

  const tabs = [
    { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'summary', label: 'Summary', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'quiz', label: 'Quiz', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen" style={{ paddingTop: '80px' }}>
      <div className="flex" style={{ height: 'calc(100vh - 80px)' }}>

        {/* Left Sidebar (Collapsible) */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex-shrink-0 border-r hidden md:block overflow-hidden"
              style={{ borderColor: 'var(--border-muted)', background: 'var(--bg-app)' }}
            >
              <div className="w-[280px] h-full">
                <VideoSidebar currentVideoId={videoId} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Content Area (Flexible) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

          {/* Global Toggle Button (visible when no video is selected) */}
          {!videoId && (
            <div className="absolute top-6 left-6 z-10">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2.5 rounded-[10px] bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all cursor-pointer shadow-sm"
                title={isSidebarOpen ? "Close Library" : "Open Library"}
              >
                {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
              </button>
            </div>
          )}

          {!videoId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-app)]">
              <div className="w-20 h-20 rounded-[20px] bg-[var(--accent-muted)] flex items-center justify-center mb-6">
                <FileVideo className="w-10 h-10" style={{ color: 'var(--accent)' }} />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Select a Video</h2>
              <p className="max-w-md mb-8" style={{ color: 'var(--text-secondary)' }}>
                Choose a video from your library on the left to start asking questions, generating summaries, and creating quizzes.
              </p>
              <Button onClick={() => navigate('/teacher')} className="flex items-center gap-2 btn-primary">
                <UploadIcon className="w-4 h-4" /> Upload New Video
              </Button>
            </div>
          ) : (
            <>
              {/* Center — Video Player */}
              <motion.div
                className="lg:w-[60%] p-5 flex flex-col overflow-y-auto custom-scrollbar"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="player-container">
                  <div className="relative w-full h-full bg-black">
                    {isLoading ? (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>Loading player...</div>
                    ) : !video?.sourceUrl && video?.sourceType === 'upload' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-6" style={{ background: 'var(--bg-elevated)' }}>
                        <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin mb-4" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                        <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Uploading to Cloud storage...</h3>
                        <p className="text-xs mt-2 max-w-[250px]" style={{ color: 'var(--text-muted)' }}>
                          We're moving your video to the cloud. The player will appear automatically in a few seconds.
                        </p>
                      </div>
                    ) : video?.sourceType === 'upload' ? (
                      <video
                        ref={playerRef}
                        src={video?.sourceUrl}
                        controls
                        playsInline
                        className="w-full h-full bg-black outline-none"
                      />
                    ) : (
                      // YouTube video — use native iframe to guarantee it works and bypass ReactPlayer bugs
                      <iframe
                        ref={playerRef}
                        className="w-full h-full bg-black border-0"
                        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="YouTube Video Player"
                      />
                    )}
                  </div>
                </div>

                <div className="video-info">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      className="p-2 rounded-[8px] bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all cursor-pointer flex-shrink-0"
                      title={isSidebarOpen ? "Close Library" : "Open Library"}
                    >
                      {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                    </button>
                    <h1 className="video-title">
                      {video?.title || 'Lecture Video'}
                    </h1>
                  </div>
                  <div className="mt-2 ml-11">
                    {video?.processingStatus === 'ready' || video?.status === 'ready' ? (
                      <span className="video-status">AI processing complete</span>
                    ) : (
                      <span className="video-status" style={{ color: 'var(--accent)' }}>
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
                        AI is processing ({video?.processingStatus || video?.status})...
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Right — AI Panel */}
              <motion.div
                className="lg:w-[40%] flex flex-col border-l"
                style={{ borderColor: 'var(--border-muted)', background: 'var(--bg-base)' }}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                {/* Tab Bar */}
                <div className="p-4 border-b" style={{ borderColor: 'var(--border-muted)', background: 'var(--bg-app)' }}>
                  <div className="tab-bar m-0">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`tab-btn flex items-center justify-center gap-2 ${isActive ? 'active' : ''}`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeTabBg"
                              className="tab-active-bg inset-0"
                              transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                            />
                          )}
                          <span className="relative z-10 flex items-center gap-2">
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-hidden relative">
                  {(video?.processingStatus !== 'ready' && video?.status !== 'ready') && (
                    <div className="absolute inset-0 z-10 bg-bg-app/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-12 h-12 rounded-full border-4 border-bg-card border-t-coral animate-spin mb-4" />
                      <h3 className="text-text-primary font-medium mb-1">Processing Video...</h3>
                      <p className="text-sm text-text-secondary">AI features will be available once transcription and embedding are complete.</p>
                    </div>
                  )}
                  {activeTab === 'chat' && <ChatPanel videoId={videoId} onTimestampClick={seekToTimestamp} />}
                  {activeTab === 'summary' && <SummaryPanel videoId={videoId} />}
                  {activeTab === 'quiz' && <QuizPanel videoId={videoId} />}
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPage;
