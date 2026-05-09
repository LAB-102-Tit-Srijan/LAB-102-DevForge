import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Loader2, CheckCircle, AlertCircle, FileVideo, X, ArrowRight, Play } from 'lucide-react';
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

const TeacherDashboard = () => {
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
          setTimeout(() => navigate(`/library/${id}`), 1500);
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
    <div className="min-h-screen relative" style={{ paddingTop: '120px', paddingBottom: '48px' }}>
      <div className="max-w-[900px] mx-auto px-5 md:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-coral to-coral-light flex items-center justify-center mx-auto mb-5 shadow-lg shadow-coral-glow">
              <Upload className="w-8 h-8 text-bg-app" />
            </div>
            <h1 className="text-4xl font-bold mb-3 tracking-tight">Upload & Process</h1>
            <p className="text-text-secondary text-lg max-w-md mx-auto leading-relaxed">
              Paste a YouTube URL or upload an MP4 file to transform it into an interactive AI tutor.
            </p>
          </div>

          {/* Input Mode Tabs */}
          <div className="flex gap-2 justify-center mb-8">
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
          </div>

          {/* Input Card */}
          <div className="rounded-[24px] bg-bg-card border border-border-default p-8 card-shadow mb-8">
            {inputMode === 'url' ? (
              <div>
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <Play className="w-5 h-5 text-coral" />
                  Process a YouTube Lecture
                </h2>
                <p className="text-sm text-text-secondary mb-6">
                  Enter a YouTube URL. We'll download the audio, transcribe it with AI, and prepare it for Q&A.
                </p>
                <div className="flex gap-3">
                  <input
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setError(''); }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    disabled={processing}
                    className="flex-1 px-5 py-3 rounded-[16px] bg-bg-input border border-border-default text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-border-strong transition-all duration-300 disabled:opacity-40"
                  />
                  <button
                    onClick={handleProcessUrl}
                    disabled={processing}
                    className="px-6 py-3 rounded-[14px] bg-gradient-to-r from-coral to-coral-light text-bg-app font-semibold text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,139,0.25)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Process</span><ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
                {error && <p className="text-sm text-error mt-3">{error}</p>}
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <FileVideo className="w-5 h-5 text-coral" />
                  Upload a Video File
                </h2>
                <p className="text-sm text-text-secondary mb-6">
                  Upload an MP4 or video file. We'll extract the audio, transcribe it with AI, and prepare it for Q&A.
                </p>
                <div
                  onDrop={handleFileDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => !processing && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[24px] p-10 text-center cursor-pointer transition-all duration-300 ${
                    file ? 'border-border-strong bg-coral-muted' : 'border-border-default hover:border-border-strong hover:bg-bg-elevated/50'
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
                  className="w-full mt-5 h-14 rounded-[16px] bg-gradient-to-r from-coral to-coral-light text-bg-app font-bold text-base transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,139,0.25)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {processing ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading & Processing...</> : <>Upload & Process <ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
            )}
          </div>

          {/* Status Display */}
          {status && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="rounded-[24px] bg-bg-card border border-border-default p-8 card-shadow">
                <div className="flex items-center gap-4 mb-6">
                  {status === 'ready' ? (
                    <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center"><CheckCircle className="w-6 h-6 text-success" /></div>
                  ) : status === 'failed' ? (
                    <div className="w-12 h-12 rounded-full bg-error/15 flex items-center justify-center"><AlertCircle className="w-6 h-6 text-error" /></div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-coral-muted flex items-center justify-center"><Loader2 className="w-6 h-6 text-coral animate-spin" /></div>
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
                    <div className="h-2.5 bg-bg-secondary rounded-full overflow-hidden mb-6">
                      <motion.div className="h-full bg-gradient-to-r from-coral to-coral-light rounded-full" initial={{ width: '0%' }} animate={{ width: `${statusProgress}%` }} transition={{ duration: 0.5 }} />
                    </div>
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
                {status === 'ready' && <p className="text-sm text-success mt-4 text-center font-medium">✨ Redirecting to your learning workspace...</p>}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
