import { useState } from 'react';
import { BookOpen, Clock, FileText, BookMarked } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Button from '../ui/Button';
import { generateSummary } from '../../lib/api';

const modes = [
  { id: 'last5', label: 'Last 5 Min', icon: <Clock className="w-4 h-4" /> },
  { id: 'short', label: 'Short', icon: <FileText className="w-4 h-4" /> },
  { id: 'normal', label: 'Normal', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'detailed', label: 'Detailed', icon: <BookMarked className="w-4 h-4" /> },
];

const SummaryPanel = ({ videoId }) => {
  const [selectedMode, setSelectedMode] = useState('normal');
  const [summary, setSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setSummary('');
    setIsGenerating(true);
    let fullContent = '';
    try {
      await generateSummary(
        { videoId, mode: selectedMode },
        (chunk) => { if (chunk.token) { fullContent += chunk.token; setSummary(fullContent); } },
        () => setIsGenerating(false)
      );
    } catch (err) {
      setSummary(`Error: ${err.message}`);
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-5">
      {/* Mode Selector */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setSelectedMode(mode.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
              selectedMode === mode.id
                ? 'bg-gradient-to-r from-coral to-coral-light text-bg-app shadow-lg'
                : 'bg-bg-card border border-border-default text-text-muted hover:text-text-primary hover:border-border-strong'
            }`}
          >
            {mode.icon}{mode.label}
          </button>
        ))}
      </div>

      <Button onClick={handleGenerate} disabled={isGenerating} loading={isGenerating} className="w-full mb-5">
        {isGenerating ? 'Generating...' : 'Generate Summary'}
      </Button>

      {/* Summary Content */}
      <div className="flex-1 overflow-y-auto">
        {summary ? (
          <div className="markdown-body bg-bg-card border border-border-default rounded-[20px] p-5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
            {isGenerating && <span className="inline-block w-2 h-5 bg-coral animate-pulse ml-0.5 rounded-sm" />}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-[18px] bg-bg-card border border-border-default flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7 text-text-muted" />
            </div>
            <p className="text-text-secondary text-sm">Select a mode and generate a summary</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryPanel;
