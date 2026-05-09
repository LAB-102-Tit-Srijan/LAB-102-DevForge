import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import ReactPlayer from 'react-player';
import { MessageSquare, BookOpen, HelpCircle, FileVideo, Upload as UploadIcon } from 'lucide-react';
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
      if (typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(seconds, 'seconds'); // ReactPlayer
      } else {
        playerRef.current.currentTime = seconds; // Native video
        playerRef.current.play().catch(() => {});
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
        
        {/* Left Sidebar (250px approx, 20%) */}
        <div className="w-[280px] flex-shrink-0 border-r border-border-default hidden md:block">
          <VideoSidebar currentVideoId={videoId} />
        </div>

        {/* Right Content Area (Flexible) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {!videoId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bg-app">
              <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-coral/10 to-coral-light/10 flex items-center justify-center mb-6">
                <FileVideo className="w-10 h-10 text-coral" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Select a Video</h2>
              <p className="text-text-secondary max-w-md mb-8">
                Choose a video from your library on the left to start asking questions, generating summaries, and creating quizzes.
              </p>
              <Button onClick={() => navigate('/teacher')} className="flex items-center gap-2">
                <UploadIcon className="w-4 h-4" /> Upload New Video
              </Button>
            </div>
          ) : (
            <>
              {/* Center — Video Player */}
              <motion.div
                className="lg:w-[60%] p-5 flex flex-col"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="rounded-[24px] bg-bg-card border border-border-default p-5 card-shadow flex-shrink-0">
                  <div className="relative w-full aspect-video rounded-[16px] overflow-hidden bg-bg-app">
                    {isLoading ? (
                      <div className="w-full h-full flex items-center justify-center text-text-muted">Loading player...</div>
                    ) : !video?.sourceUrl && video?.sourceType === 'upload' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-bg-secondary/20">
                        <div className="w-12 h-12 rounded-full border-2 border-coral border-t-transparent animate-spin mb-4" />
                        <h3 className="text-text-primary font-medium">Uploading to Cloud storage...</h3>
                        <p className="text-xs text-text-muted mt-2 max-w-[250px]">
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
                      <ReactPlayer
                        ref={playerRef}
                        url={video?.sourceUrl || `https://www.youtube.com/watch?v=${videoId}`}
                        width="100%"
                        height="100%"
                        controls
                        playsinline
                        pip
                        config={{ 
                          youtube: { playerVars: { modestbranding: 1, rel: 0 } },
                          file: { attributes: { controlsList: 'nodownload' } }
                        }}
                      />
                    )}
                  </div>
                </div>
                <div className="mt-4 px-2">
                  <h1 className="text-xl font-semibold text-text-primary tracking-tight">
                    {video?.title || 'Lecture Video'}
                  </h1>
                  <p className="text-sm text-text-secondary mt-1.5 flex items-center gap-2">
                    {video?.processingStatus === 'ready' || video?.status === 'ready' ? (
                      <span className="text-green-400 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-400 pulse-ring" /> AI processing complete</span>
                    ) : (
                      <span className="text-coral flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-coral animate-pulse" /> AI is processing ({video?.processingStatus || video?.status})...</span>
                    )}
                  </p>
                </div>
              </motion.div>

              {/* Right — AI Panel */}
              <motion.div
                className="lg:w-[40%] flex flex-col border-l border-border-default bg-bg-app"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                {/* Tab Bar */}
                <div className="flex gap-1 p-3 border-b border-border-default bg-bg-secondary/50">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-[14px] text-[13px] font-medium
                          transition-all duration-300 cursor-pointer
                          ${isActive
                            ? 'bg-gradient-to-r from-coral to-coral-light text-bg-app shadow-lg'
                            : 'text-text-muted hover:text-text-primary hover:bg-bg-card'
                          }
                        `}
                      >
                        {tab.icon}<span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    );
                  })}
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
