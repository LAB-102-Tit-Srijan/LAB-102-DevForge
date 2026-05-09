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
    <div className="min-h-screen pt-16">
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        <motion.div className="lg:w-[55%] p-4 flex flex-col" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-surface-elevated border border-border-subtle shadow-2xl">
            <ReactPlayer ref={playerRef} url={`https://www.youtube.com/watch?v=${videoId}`} width="100%" height="100%" controls config={{ youtube: { playerVars: { modestbranding: 1, rel: 0 } } }} />
          </div>
          <div className="mt-4 px-1">
            <h1 className="text-xl font-semibold text-text-primary">Lecture Video</h1>
            <p className="text-sm text-text-secondary mt-1">Ask questions, generate summaries, or take a quiz.</p>
          </div>
        </motion.div>
        <motion.div className="lg:w-[45%] flex flex-col border-l border-border-subtle" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex gap-1 p-2 border-b border-border-subtle">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'}`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
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
