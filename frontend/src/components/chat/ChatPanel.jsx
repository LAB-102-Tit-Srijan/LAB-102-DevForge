import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useChatStore from '../../store/chatStore';
import { sendChatMessage } from '../../lib/api';
import TimestampLink from './TimestampLink';
import SuggestedPrompts from './SuggestedPrompts';

const ChatPanel = ({ videoId, onTimestampClick }) => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const { getMessages, addMessage, updateLastMessage, getLastMessages } = useChatStore();
  const messages = getMessages(videoId);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

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
    <div className="chat-panel border-0 rounded-none bg-transparent h-full">
      {/* Header */}
      <div className="chat-header">
        <Sparkles className="w-5 h-5" style={{ color: 'var(--accent)' }} />
        <div>
          <h2 className="chat-header-title">SherySense AI</h2>
          <p className="chat-header-sub">Ask anything about this lecture</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-[20px] bg-[var(--accent-muted)] flex items-center justify-center mb-5">
              <Sparkles className="w-8 h-8" style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Ask anything about this lecture</h3>
            <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--text-secondary)' }}>Get AI-powered answers grounded in the actual video content.</p>
            <SuggestedPrompts onSelect={handleSend} />
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={msg.role === 'user' ? 'message-user' : 'message-ai'}>
              {msg.role === 'assistant' ? (
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content || ''}</ReactMarkdown>
                  {msg.isStreaming && <span className="inline-block w-2 h-5 bg-[var(--accent)] animate-pulse ml-0.5 rounded-sm" />}
                  {msg.timestamps?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border-muted)' }}>
                      {msg.timestamps.map((ts, j) => <TimestampLink key={j} timestamp={ts} onClick={() => onTimestampClick(ts.startSeconds)} />)}
                    </div>
                  )}
                </div>
              ) : <p>{msg.content}</p>}
            </div>
          </div>
        ))}
        {isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
           <div className="typing-indicator">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t" style={{ borderColor: 'var(--border-muted)' }}>
        {messages.length > 0 && <SuggestedPrompts onSelect={handleSend} compact className="mb-3" />}
        <div className="chat-input-area border-0 p-0 bg-transparent">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask about the lecture..."
            disabled={isStreaming}
            rows={1}
            className="chat-input"
            style={{ minHeight: '44px', maxHeight: '160px' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={isStreaming || !input.trim()}
            className="send-btn"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
