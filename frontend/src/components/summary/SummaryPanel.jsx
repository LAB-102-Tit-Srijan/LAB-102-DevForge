import { useState } from 'react';
import { BookOpen, Clock, FileText, BookMarked, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Button from '../ui/Button';
import { generateSummary } from '../../lib/api';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleDownloadPdf = () => {
    const element = document.getElementById('summary-content-box');
    if (!element) return;
    setIsDownloading(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 15;
      const pdfWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('SherySense Video Summary', margin, margin + 5);
      
      // Content
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      
      // Get the clean text content, preserving newlines
      const text = element.innerText;
      const lines = pdf.splitTextToSize(text, pdfWidth);
      
      let y = margin + 15;
      for (let i = 0; i < lines.length; i++) {
        if (y > pageHeight - margin) {
          pdf.addPage();
          y = margin + 5;
        }
        pdf.text(lines[i], margin, y);
        y += 5.5; // Line height
      }
      
      pdf.save('SherySense_Summary.pdf');
    } catch (err) {
      console.error('Failed to generate PDF', err);
    }
    setIsDownloading(false);
  };

  return (
    <div className="flex flex-col h-full p-5 custom-scrollbar overflow-y-auto">
      {/* Mode Selector */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setSelectedMode(mode.id)}
            className={`summary-mode-btn ${selectedMode === mode.id ? 'active' : ''}`}
          >
            {mode.icon}{mode.label}
          </button>
        ))}
      </div>

      <Button onClick={handleGenerate} disabled={isGenerating} loading={isGenerating} className="w-full mb-5 btn-primary">
        {isGenerating ? 'Generating...' : 'Generate Summary'}
      </Button>

      {/* Summary Content */}
      <div className="flex-1">
        {summary ? (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>Generated Summary</h3>
              {!isGenerating && (
                <Button 
                  onClick={handleDownloadPdf} 
                  variant="secondary" 
                  size="sm" 
                  disabled={isDownloading}
                  className="btn-secondary flex items-center gap-2 h-8 px-3 text-xs"
                >
                  <Download className="w-3.5 h-3.5" /> {isDownloading ? 'Saving...' : 'PDF'}
                </Button>
              )}
            </div>
            <div 
              id="summary-content-box" 
              className="summary-content markdown-body bg-[var(--bg-card)] border border-[var(--border-default)] rounded-[20px]"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
              {isGenerating && <span className="inline-block w-2 h-5 bg-[var(--accent)] animate-pulse ml-0.5 rounded-sm" />}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <div className="w-14 h-14 rounded-[18px] bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Select a mode and generate a summary</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryPanel;
