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
            <div className="w-16 h-16 rounded-[20px] bg-[var(--accent-muted)] flex items-center justify-center mx-auto mb-5">
              <Upload className="w-8 h-8" style={{ color: 'var(--accent)' }} />
            </div>
            <h1 className="text-4xl font-bold mb-3 tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Upload & Process</h1>
            <p className="text-lg max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Paste a YouTube URL or upload an MP4 file to transform it into an interactive AI tutor.
            </p>
          </div>

          {/* Input Mode Tabs */}
          <div className="flex gap-2 justify-center mb-8">
            <button
              onClick={() => { setInputMode('url'); setError(''); }}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all duration-300 cursor-pointer ${
                inputMode === 'url'
                  ? 'border'
                  : 'border'
              }`}
              style={inputMode === 'url' ? { borderColor: 'var(--border-strong)', color: 'var(--accent)', background: 'var(--bg-elevated)' } : { borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
            >
              <Play className="w-4 h-4" /> YouTube URL
            </button>
            <button
              onClick={() => { setInputMode('upload'); setError(''); }}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all duration-300 cursor-pointer ${
                inputMode === 'upload'
                  ? 'border'
                  : 'border'
              }`}
              style={inputMode === 'upload' ? { borderColor: 'var(--border-strong)', color: 'var(--accent)', background: 'var(--bg-elevated)' } : { borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
            >
              <FileVideo className="w-4 h-4" /> Upload MP4
            </button>
          </div>

          {/* Input Card */}
          <div className="card p-8 mb-8">
            {inputMode === 'url' ? (
              <div>
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Play className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                  Process a YouTube Lecture
                </h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                  Enter a YouTube URL. We'll download the audio, transcribe it with AI, and prepare it for Q&A.
                </p>
                <div className="flex gap-3">
                  <input
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setError(''); }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    disabled={processing}
                    className="flex-1 px-5 py-3 rounded-[10px] bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all duration-300 disabled:opacity-40"
                  />
                  <button
                    onClick={handleProcessUrl}
                    disabled={processing}
                    className="btn-primary"
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Process</span><ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
                {error && <p className="text-sm mt-3" style={{ color: 'var(--error)' }}>{error}</p>}
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FileVideo className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                  Upload a Video File
                </h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                  Upload an MP4 or video file. We'll extract the audio, transcribe it with AI, and prepare it for Q&A.
                </p>
                <div
                  onDrop={handleFileDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => !processing && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[20px] p-10 text-center cursor-pointer transition-all duration-300 ${
                    file ? '' : 'hover:bg-[var(--bg-elevated)]'
                  } ${processing ? 'opacity-40 cursor-not-allowed' : ''}`}
                  style={{ borderColor: file ? 'var(--border-strong)' : 'var(--border-default)', background: file ? 'var(--accent-muted)' : 'transparent' }}
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
                      <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="ml-2 p-2 rounded-xl transition-colors" style={{ color: 'var(--text-muted)' }}>
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
                  className="w-full mt-5 btn-primary h-14"
                >
                  {processing ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading & Processing...</> : <>Upload & Process <ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
            )}
          </div>

          {/* Status Display */}
          {status && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="card p-8">
                <div className="flex items-center gap-4 mb-6">
                  {status === 'ready' ? (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(22, 101, 52, 0.15)' }}><CheckCircle className="w-6 h-6" style={{ color: '#4ADE80' }} /></div>
                  ) : status === 'failed' ? (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(190, 18, 60, 0.15)' }}><AlertCircle className="w-6 h-6" style={{ color: 'var(--error)' }} /></div>
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-muted)' }}><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} /></div>
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
                    <div className="h-2.5 rounded-full overflow-hidden mb-6" style={{ background: 'var(--bg-elevated)' }}>
                      <motion.div className="h-full rounded-full" style={{ background: 'var(--accent)' }} initial={{ width: '0%' }} animate={{ width: `${statusProgress}%` }} transition={{ duration: 0.5 }} />
                    </div>
                    <div className="space-y-2">
                      {steps.map((step, i) => {
                        const isDone = i < currentStepIndex;
                        const isCurrent = i === currentStepIndex;
                        return (
                          <div key={step.key} className={`flex items-center gap-3 text-sm py-1.5`} style={{ color: isDone ? '#4ADE80' : isCurrent ? 'var(--accent)' : 'var(--text-muted)' }}>
                            <div className={`w-2 h-2 rounded-full`} style={{ background: isDone ? '#4ADE80' : isCurrent ? 'var(--accent)' : 'var(--text-muted)' }} />
                            {step.label}
                            {isDone && <CheckCircle className="w-3.5 h-3.5 ml-auto" />}
                            {isCurrent && <Loader2 className="w-3.5 h-3.5 ml-auto animate-spin" />}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                {status === 'ready' && <p className="text-sm mt-4 text-center font-medium" style={{ color: '#4ADE80' }}>✨ Redirecting to your learning workspace...</p>}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
