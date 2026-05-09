import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactPlayer from 'react-player';
import { MessageSquare, BookOpen, HelpCircle } from 'lucide-react';
import ChatPanel from '../components/chat/ChatPanel';
import SummaryPanel from '../components/summary/SummaryPanel';
import QuizPanel from '../components/quiz/QuizPanel';
import useChatStore from '../store/chatStore';

const VideoPage = () => {
  const { videoId } = useParams();
  const playerRef = useRef(null);
  const [activeTab, setActiveTab] = useState('chat');
  const { setActiveVideo } = useChatStore();

  useEffect(() => { setActiveVideo(videoId); }, [videoId, setActiveVideo]);

  const seekToTimestamp = useCallback((seconds) => {
    if (playerRef.current) playerRef.current.seekTo(seconds, 'seconds');
  }, []);

  const tabs = [
    { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'summary', label: 'Summary', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'quiz', label: 'Quiz', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen" style={{ paddingTop: '80px' }}>
      <div className="flex flex-col lg:flex-row" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Left — Video Panel (58%) */}
        <motion.div
          className="lg:w-[58%] p-5 flex flex-col"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-[24px] bg-bg-card border border-border-default p-5 card-shadow flex-shrink-0">
            <div className="relative w-full aspect-video rounded-[16px] overflow-hidden bg-bg-app">
              <ReactPlayer
                ref={playerRef}
                url={`https://www.youtube.com/watch?v=${videoId}`}
                width="100%"
                height="100%"
                controls
                config={{ youtube: { playerVars: { modestbranding: 1, rel: 0 } } }}
              />
            </div>
          </div>
          <div className="mt-4 px-2">
            <h1 className="text-xl font-semibold text-text-primary tracking-tight">Lecture Video</h1>
            <p className="text-sm text-text-secondary mt-1.5">Ask questions, generate summaries, or take a quiz.</p>
          </div>
        </motion.div>

        {/* Right — Chat Panel (42%) */}
        <motion.div
          className="lg:w-[42%] flex flex-col border-l border-border-default"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
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
                    flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[14px] text-[13px] font-medium
                    transition-all duration-300 cursor-pointer
                    ${isActive
                      ? 'bg-gradient-to-r from-coral to-coral-light text-bg-app shadow-lg'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-card'
                    }
                  `}
                >
                  {tab.icon}{tab.label}
                </button>
              );
            })}
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' && <ChatPanel videoId={videoId} onTimestampClick={seekToTimestamp} />}
            {activeTab === 'summary' && <SummaryPanel videoId={videoId} />}
            {activeTab === 'quiz' && <QuizPanel videoId={videoId} />}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VideoPage;
