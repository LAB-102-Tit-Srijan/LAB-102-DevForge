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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 pb-0">
        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-coral" />
          SherySense AI
        </h2>
        <p className="text-[13px] text-text-muted mt-0.5">Ask anything about this lecture</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-coral to-coral-light flex items-center justify-center mb-5 shadow-lg shadow-coral-glow">
              <Sparkles className="w-8 h-8 text-bg-app" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ask anything about this lecture</h3>
            <p className="text-text-secondary text-sm mb-6 max-w-xs">Get AI-powered answers grounded in the actual video content.</p>
            <SuggestedPrompts onSelect={handleSend} />
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-[20px] px-5 py-3.5 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-coral/20 to-coral-light/10 border border-border-strong text-text-primary rounded-br-lg'
                  : 'bg-bg-card border border-border-default text-text-primary rounded-bl-lg'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content || ''}</ReactMarkdown>
                  {msg.isStreaming && <span className="inline-block w-2 h-5 bg-coral animate-pulse ml-0.5 rounded-sm" />}
                  {msg.timestamps?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border-default">
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

      {/* Input Area */}
      <div className="p-4 border-t border-border-default">
        {messages.length > 0 && <SuggestedPrompts onSelect={handleSend} compact className="mb-3" />}
        <div className="rounded-[20px] border border-border-default bg-bg-card p-3 flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask about the lecture..."
            disabled={isStreaming}
            rows={1}
            className="flex-1 bg-transparent text-text-primary placeholder-text-muted focus:outline-none disabled:opacity-40 text-sm resize-none leading-relaxed"
            style={{ minHeight: '40px', maxHeight: '160px' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={isStreaming || !input.trim()}
            className="w-11 h-11 rounded-[14px] bg-gradient-to-r from-coral to-coral-light text-bg-app flex items-center justify-center transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,139,0.3)] disabled:opacity-30 disabled:cursor-not-allowed shrink-0 cursor-pointer"
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
