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
  processing: 'primary',
  transcribing: 'accent',
  embedding: 'primary',
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 dot-pattern" />
      <div className="hero-glow" />

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
              className="mb-8"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coral-muted border border-border-strong text-coral text-[13px] font-medium tracking-wide backdrop-blur-sm">
                <span className="w-1.5 h-1.5 bg-coral rounded-full" />
                AI Lecture Companion
              </span>
            </motion.div>

            {/* Hero Heading */}
            <motion.h1
              variants={{ initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
              className="font-bold tracking-[-0.04em] leading-[0.95] mb-8"
              style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)' }}
            >
              Unlock the{' '}
              <span className="gradient-text-hero">Intelligence</span>
              <br />
              Within Every Video.
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              className="text-text-secondary text-lg max-w-[700px] mx-auto mb-12 leading-relaxed"
            >
              Transform video lectures into intelligent study sessions — ask questions,
              jump to timestamps, generate quizzes, and create smart summaries.
            </motion.p>

            {/* Input Mode Tabs */}
            <motion.div
              variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              className="flex gap-2 justify-center mb-6"
            >
              <button
                onClick={() => { setInputMode('url'); setError(''); }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all duration-300 cursor-pointer ${
                  inputMode === 'url'
                    ? 'bg-coral-muted border border-border-strong text-coral'
                    : 'border border-border-default text-text-muted hover:text-text-secondary hover:border-border-strong'
                }`}
              >
                <Play className="w-4 h-4" /> YouTube URL
              </button>
              <button
                onClick={() => { setInputMode('upload'); setError(''); }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all duration-300 cursor-pointer ${
                  inputMode === 'upload'
                    ? 'bg-coral-muted border border-border-strong text-coral'
                    : 'border border-border-default text-text-muted hover:text-text-secondary hover:border-border-strong'
                }`}
              >
                <FileVideo className="w-4 h-4" /> Upload MP4
              </button>
            </motion.div>

            {/* Input Container */}
            <motion.div
              variants={{ initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
              className="max-w-[900px] mx-auto"
            >
              {inputMode === 'url' ? (
                <div className="relative rounded-[28px] border border-border-default bg-bg-card/60 backdrop-blur-xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:border-border-strong transition-all duration-300">
                  <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 220px' }}>
                    <input
                      value={url}
                      onChange={(e) => { setUrl(e.target.value); setError(''); }}
                      placeholder="Paste a YouTube URL..."
                      disabled={processing}
                      className="h-16 px-6 text-lg bg-transparent text-text-primary placeholder-text-muted focus:outline-none disabled:opacity-40 w-full rounded-[20px]"
                    />
                    <button
                      onClick={handleProcessUrl}
                      disabled={processing}
                      className="h-16 px-8 rounded-[20px] bg-gradient-to-r from-coral to-coral-light text-bg-app font-bold text-base transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,139,0.25)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {processing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Process Video
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                  {error && <p className="text-sm text-error mt-2 px-3">{error}</p>}
                </div>
              ) : (
                <div className="rounded-[28px] border border-border-default bg-bg-card/60 backdrop-blur-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                  <div
                    onDrop={handleFileDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => !processing && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-[24px] p-10 text-center cursor-pointer transition-all duration-300 ${
                      file ? 'border-border-strong bg-coral-muted' : 'border-border-default hover:border-border-strong hover:bg-bg-card/50'
                    } ${processing ? 'opacity-40 cursor-not-allowed' : ''}`}
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
                        <FileVideo className="w-10 h-10 text-coral" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-text-primary">{file.name}</p>
                          <p className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="ml-2 p-2 rounded-xl hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-12 h-12 text-text-muted mx-auto mb-4" />
                        <p className="text-text-secondary font-medium">Drop a video file here or click to browse</p>
                        <p className="text-xs text-text-muted mt-2">MP4, MKV, AVI, MOV, WebM (max 500MB)</p>
                      </div>
                    )}
                  </div>
                  {error && <p className="text-sm text-error mt-3">{error}</p>}
                  <button
                    onClick={handleUploadFile}
                    disabled={processing || !file}
                    className="w-full mt-4 h-14 rounded-[16px] bg-gradient-to-r from-coral to-coral-light text-bg-app font-bold text-base transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,139,0.25)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Uploading & Processing...
                      </>
                    ) : (
                      <>
                        Upload & Process
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>

            {/* Supported Platforms */}
            {!status && (
              <motion.div
                variants={{ initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.5, delay: 0.3 } } }}
                className="mt-8 flex items-center justify-center gap-6"
              >
                <span className="text-[13px] text-text-muted">Supported:</span>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary">
                    <Play className="w-4 h-4 text-coral" />
                    YouTube URL
                  </span>
                  <span className="text-border-default">|</span>
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary">
                    <FileVideo className="w-4 h-4 text-coral" />
                    MP4 Upload
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Status Display */}
          {status && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-[700px] mx-auto mt-12"
            >
              <div className="rounded-[24px] bg-bg-card border border-border-default p-8 card-shadow">
                <div className="flex items-center gap-4 mb-6">
                  {status === 'ready' ? (
                    <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-success" />
                    </div>
                  ) : status === 'failed' ? (
                    <div className="w-12 h-12 rounded-full bg-error/15 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-error" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-coral-muted flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-coral animate-spin" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-text-primary text-lg">Processing Video</span>
                      <Badge variant={statusVariants[status]}>{status}</Badge>
                    </div>
                    <p className="text-sm text-text-secondary">{statusMessages[status]}</p>
                  </div>
                </div>

                {status !== 'failed' && (
                  <>
                    {/* Progress Bar */}
                    <div className="h-2.5 bg-bg-secondary rounded-full overflow-hidden mb-6">
                      <motion.div
                        className="h-full bg-gradient-to-r from-coral to-coral-light rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: `${statusProgress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>

                    {/* Step List */}
                    <div className="space-y-2">
                      {steps.map((step, i) => {
                        const isDone = i < currentStepIndex;
                        const isCurrent = i === currentStepIndex;
                        return (
                          <div key={step.key} className={`flex items-center gap-3 text-sm py-1.5 ${isDone ? 'text-success' : isCurrent ? 'text-coral' : 'text-text-muted'}`}>
                            <div className={`w-2 h-2 rounded-full ${isDone ? 'bg-success' : isCurrent ? 'bg-coral' : 'bg-text-muted/30'}`} />
                            {step.label}
                            {isDone && <CheckCircle className="w-3.5 h-3.5 ml-auto" />}
                            {isCurrent && <Loader2 className="w-3.5 h-3.5 ml-auto animate-spin" />}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {status === 'ready' && (
                  <p className="text-sm text-success mt-4 text-center font-medium">
                    ✨ Redirecting to your learning workspace...
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-default py-8 relative">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-coral" />
            <span className="text-sm font-semibold gradient-text">SheriSense</span>
          </div>
          <p className="text-text-muted text-[13px]">
            Built with ❤️ for Sheriyans Coding School
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
