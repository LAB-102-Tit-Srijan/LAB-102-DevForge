import { useState } from 'react';
import { BookOpen, Clock, FileText, BookMarked, Loader2 } from 'lucide-react';
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
    <div className="flex flex-col h-full p-4">
      <div className="flex gap-2 mb-4">
        {modes.map((mode) => (
          <button key={mode.id} onClick={() => setSelectedMode(mode.id)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${selectedMode === mode.id ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-surface-elevated border border-border-subtle text-text-secondary hover:text-text-primary'}`}>
            {mode.icon}{mode.label}
          </button>
        ))}
      </div>
      <Button onClick={handleGenerate} disabled={isGenerating} loading={isGenerating} className="w-full mb-4">
        {isGenerating ? 'Generating...' : 'Generate Summary'}
      </Button>
      <div className="flex-1 overflow-y-auto">
        {summary ? (
          <div className="markdown-body bg-surface-elevated border border-border-subtle rounded-2xl p-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
            {isGenerating && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <BookOpen className="w-12 h-12 text-text-muted mb-4" />
            <p className="text-text-secondary">Select a mode and generate a summary</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryPanel;
