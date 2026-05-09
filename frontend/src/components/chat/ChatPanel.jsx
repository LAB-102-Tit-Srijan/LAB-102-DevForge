import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Button from '../ui/Button';
import useChatStore from '../../store/chatStore';
import { sendChatMessage } from '../../lib/api';
import TimestampLink from './TimestampLink';
import SuggestedPrompts from './SuggestedPrompts';

const ChatPanel = ({ videoId, onTimestampClick }) => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const { getMessages, addMessage, updateLastMessage, getLastMessages } = useChatStore();
  const messages = getMessages(videoId);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (text) => {
    const question = text || input.trim();
    if (!question || isStreaming) return;
    setInput('');
    addMessage(videoId, { role: 'user', content: question });
    addMessage(videoId, { role: 'assistant', content: '', timestamps: [], isStreaming: true });
    setIsStreaming(true);
    let fullContent = '';
    let timestamps = [];
    try {
      await sendChatMessage(
        { videoId, question, history: getLastMessages(videoId, 10).filter(m => !m.isStreaming) },
        (chunk) => {
          if (chunk.token) { fullContent += chunk.token; updateLastMessage(videoId, { content: fullContent }); }
          if (chunk.timestamps) { timestamps = chunk.timestamps; updateLastMessage(videoId, { timestamps }); }
        },
        () => { updateLastMessage(videoId, { isStreaming: false, content: fullContent, timestamps }); setIsStreaming(false); }
      );
    } catch (err) {
      updateLastMessage(videoId, { content: `Error: ${err.message}`, isStreaming: false });
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ask anything about this lecture</h3>
            <p className="text-text-secondary text-sm mb-6">Get AI-powered answers grounded in the actual video content.</p>
            <SuggestedPrompts onSelect={handleSend} />
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-primary text-white rounded-br-md' : 'bg-surface-elevated border border-border-subtle rounded-bl-md'}`}>
              {msg.role === 'assistant' ? (
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content || ''}</ReactMarkdown>
                  {msg.isStreaming && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />}
                  {msg.timestamps?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border-subtle">
                      {msg.timestamps.map((ts, j) => <TimestampLink key={j} timestamp={ts} onClick={() => onTimestampClick(ts.startSeconds)} />)}
                    </div>
                  )}
                </div>
              ) : <p className="text-sm leading-relaxed">{msg.content}</p>}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-border-subtle">
        {messages.length > 0 && <SuggestedPrompts onSelect={handleSend} compact className="mb-3" />}
        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder="Ask about the lecture..." disabled={isStreaming} className="flex-1 px-4 py-2.5 rounded-xl bg-surface-elevated border border-border-subtle text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50" />
          <Button onClick={() => handleSend()} disabled={isStreaming || !input.trim()} size="icon"><Send className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
