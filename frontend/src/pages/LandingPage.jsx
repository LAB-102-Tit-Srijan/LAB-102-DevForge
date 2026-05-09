import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle, FileVideo, X, ArrowRight, Upload, Play, Sparkles } from 'lucide-react';
import Badge from '../components/ui/Badge';
import { toast } from '../lib/toast';
import { processVideo, getVideoStatus, uploadVideoFile } from '../lib/api';

const statusMessages = {
  queued: 'Video is queued for processing...',
  processing: 'Downloading and extracting audio...',
  transcribing: 'Transcribing audio with AI (Groq Whisper)...',
  embedding: 'Generating embeddings and storing in vector DB...',
  ready: 'Video is ready! Redirecting...',
  failed: 'Processing failed. Please try again.',
};

const statusVariants = {
  queued: 'warning',
  processing: 'info',
  transcribing: 'accent',
  embedding: 'info',
  ready: 'success',
  failed: 'error',
};

const steps = [
  { key: 'queued', label: 'Queued' },
  { key: 'processing', label: 'Downloading Audio' },
  { key: 'transcribing', label: 'Transcribing' },
  { key: 'embedding', label: 'Embedding' },
  { key: 'ready', label: 'Ready' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [inputMode, setInputMode] = useState('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState(null);

  const validateUrl = (url) => {
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/youtu\.be\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
    ];
    return patterns.some((p) => p.test(url));
  };

  const pollStatus = async (id) => {
    const poll = async () => {
      try {
        const { data } = await getVideoStatus(id);
        setStatus(data.status);
        if (data.status === 'ready') {
          toast.success('Video processed successfully!');
          setTimeout(() => navigate(`/video/${id}`), 1500);
          return;
        }
        if (data.status === 'failed') {
          toast.error(data.errorMessage || 'Video processing failed.');
          setProcessing(false);
          return;
        }
        setTimeout(poll, 3000);
      } catch (err) {
        console.error('Polling error:', err);
        setTimeout(poll, 3000);
      }
    };
    poll();
  };

  const handleProcessUrl = async () => {
    setError('');
    if (!url.trim()) { setError('Please enter a YouTube URL'); return; }
    if (!validateUrl(url.trim())) { setError('Please enter a valid YouTube URL'); return; }
    setProcessing(true);
    setStatus('queued');
    try {
      const { data } = await processVideo(url.trim());
      toast.info('Video processing started!');
      pollStatus(data.videoId);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to process video';
      setError(message);
      toast.error(message);
      setProcessing(false);
      setStatus(null);
    }
  };

  const handleUploadFile = async () => {
    setError('');
    if (!file) { setError('Please select a video file'); return; }
    setProcessing(true);
    setStatus('queued');
    try {
      const { data } = await uploadVideoFile(file);
      toast.info('Video uploaded and processing started!');
      pollStatus(data.videoId);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to upload video';
      setError(message);
      toast.error(message);
      setProcessing(false);
      setStatus(null);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped) setFile(dropped);
  };

  const statusProgress = status === 'queued' ? 15
    : status === 'processing' ? 35
    : status === 'transcribing' ? 55
    : status === 'embedding' ? 80
    : status === 'ready' ? 100 : 0;

  const currentStepIndex = steps.findIndex(s => s.key === status);

  const headlineWords = "Unlock the Intelligence Within Every Video.".split(' ');

  return (
    <div 
      className="min-h-screen relative overflow-hidden" 
      style={{ 
        background: 'radial-gradient(ellipse 60% 40% at 20% 80%, rgba(190, 18, 60, 0.06) 0%, transparent 70%), var(--bg-base)'
      }}
    >
      {/* Hero Section */}
      <section className="relative" style={{ paddingTop: '160px', paddingBottom: '80px' }}>
        <div className="max-w-[1100px] mx-auto px-5 md:px-8">
          <motion.div
            className="text-center"
            initial="initial"
            animate="animate"
            variants={{ animate: { transition: { staggerChildren: 0.12 } } }}
          >
            {/* Badge */}
            <motion.div
              variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            >
              <span className="hero-badge">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                AI Lecture Companion
              </span>
            </motion.div>

            {/* Hero Heading */}
            <h1 className="mb-8" style={{ fontSize: 'clamp(56px, 8vw, 96px)', fontFamily: 'var(--font-display)' }}>
              {headlineWords.map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, filter: 'blur(8px)', y: 16 }}
                  animate={{ opacity: 1, filter: 'blur(0)', y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                  className="inline-block mr-3"
                  style={{ color: word === 'Intelligence' ? 'var(--accent)' : 'var(--text-primary)' }}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            {/* Subtitle */}
            <motion.p
              variants={{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.4 } } }}
              className="mx-auto mb-12 leading-relaxed"
              style={{ maxWidth: '520px', fontSize: '18px', color: 'var(--text-secondary)' }}
            >
              Transform video lectures into intelligent study sessions — ask questions,
              jump to timestamps, generate quizzes, and create smart summaries.
            </motion.p>

            {/* Input Mode Tabs */}
            <motion.div
              variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.5 } } }}
              className="flex gap-2 justify-center mb-6"
            >
              <button
                onClick={() => { setInputMode('url'); setError(''); }}
                className="btn-secondary"
                style={{ 
                  borderColor: inputMode === 'url' ? 'var(--border-strong)' : 'var(--border-default)',
                  color: inputMode === 'url' ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                <Play className="w-4 h-4 inline mr-2" /> YouTube URL
              </button>
              <button
                onClick={() => { setInputMode('upload'); setError(''); }}
                className="btn-secondary"
                style={{ 
                  borderColor: inputMode === 'upload' ? 'var(--border-strong)' : 'var(--border-default)',
                  color: inputMode === 'upload' ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                <FileVideo className="w-4 h-4 inline mr-2" /> Upload MP4
              </button>
            </motion.div>

            {/* Input Container */}
            <motion.div
              variants={{ initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.6 } } }}
              className="max-w-[900px] mx-auto"
            >
              {inputMode === 'url' ? (
                <div className="card p-3">
                  <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 220px' }}>
                    <input
                      value={url}
                      onChange={(e) => { setUrl(e.target.value); setError(''); }}
                      placeholder="Paste a YouTube URL..."
                      disabled={processing}
                      className="h-16 px-6 text-lg bg-transparent focus:outline-none disabled:opacity-40 w-full rounded-[10px]"
                      style={{ color: 'var(--text-primary)' }}
                    />
                    <button
                      onClick={handleProcessUrl}
                      disabled={processing}
                      className="btn-primary flex items-center justify-center gap-2 h-16 w-full"
                    >
                      {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>Process Video <ArrowRight className="w-5 h-5" /></>
                      )}
                    </button>
                  </div>
                  {error && <p className="text-sm mt-2 px-3" style={{ color: 'var(--error)' }}>{error}</p>}
                </div>
              ) : (
                <div className="card p-6">
                  <div
                    onDrop={handleFileDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => !processing && fileInputRef.current?.click()}
                    className={`dropzone ${file ? 'drag-over' : ''} ${processing ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".mp4,.mkv,.avi,.mov,.webm,.mp3,.wav"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                      disabled={processing}
                    />
                    {file ? (
                      <div className="flex items-center justify-center gap-4">
                        <FileVideo className="w-10 h-10" style={{ color: 'var(--accent)' }} />
                        <div className="text-left">
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="ml-2 p-2 rounded-xl transition-colors hover:bg-[var(--bg-elevated)]" style={{ color: 'var(--text-muted)' }}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                        <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Drop a video file here or click to browse</p>
                        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>MP4, MKV, AVI, MOV, WebM (max 500MB)</p>
                      </div>
                    )}
                  </div>
                  {error && <p className="text-sm mt-3" style={{ color: 'var(--error)' }}>{error}</p>}
                  <button
                    onClick={handleUploadFile}
                    disabled={processing || !file}
                    className="btn-primary w-full mt-4 h-14 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Uploading & Processing...</>
                    ) : (
                      <><Upload className="w-5 h-5" /> Upload & Process</>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Status Display */}
          {status && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-[700px] mx-auto mt-12"
            >
              <div className="card p-8">
                <div className="flex items-center gap-4 mb-6">
                  {status === 'ready' ? (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--success-bg)' }}>
                      <CheckCircle className="w-6 h-6" style={{ color: 'var(--success)' }} />
                    </div>
                  ) : status === 'failed' ? (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-muted)' }}>
                      <AlertCircle className="w-6 h-6" style={{ color: 'var(--error)' }} />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                      <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Processing Video</span>
                      <Badge variant={statusVariants[status]}>{status}</Badge>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{statusMessages[status]}</p>
                  </div>
                </div>

                {status !== 'failed' && (
                  <>
                    {/* Step List */}
                    <div className="status-stepper mt-6">
                      {steps.map((step, i) => {
                        const isDone = i < currentStepIndex;
                        const isCurrent = i === currentStepIndex;
                        return (
                          <div key={step.key} className={`status-step ${isDone ? 'completed' : isCurrent ? 'active' : ''}`}>
                            <div className="step-icon">
                              {isDone && <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />}
                              {isCurrent && <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--accent)' }} />}
                            </div>
                            <div className="step-label">
                              {step.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {status === 'ready' && (
                  <p className="text-sm mt-6 text-center font-medium" style={{ color: 'var(--success)' }}>
                    ✨ Redirecting to your learning workspace...
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 relative" style={{ borderColor: 'var(--border-muted)' }}>
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>SheriSense</span>
          </div>
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
            Built with ❤️ for Sheriyans Coding School
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
