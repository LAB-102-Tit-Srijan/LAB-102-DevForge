import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Link as LinkIcon, Loader2, CheckCircle, AlertCircle, Video, FileVideo, X } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { toast } from '../components/ui/Toast';
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

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [inputMode, setInputMode] = useState('url'); // 'url' or 'upload'
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

  const statusProgress = status === 'queued' ? '15%'
    : status === 'processing' ? '35%'
    : status === 'transcribing' ? '55%'
    : status === 'embedding' ? '80%'
    : status === 'ready' ? '100%' : '0%';

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
              <Upload className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
            <p className="text-text-secondary">
              Paste a YouTube URL or upload an MP4 file to transform it into an interactive AI tutor.
            </p>
          </div>

          {/* Input Mode Tabs */}
          <div className="flex gap-2 mb-6">
            <button onClick={() => { setInputMode('url'); setError(''); }} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${inputMode === 'url' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-surface-elevated border border-border-subtle text-text-secondary hover:text-text-primary'}`}>
              <LinkIcon className="w-4 h-4" /> YouTube URL
            </button>
            <button onClick={() => { setInputMode('upload'); setError(''); }} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${inputMode === 'upload' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-surface-elevated border border-border-subtle text-text-secondary hover:text-text-primary'}`}>
              <FileVideo className="w-4 h-4" /> Upload Video
            </button>
          </div>

          {/* Upload Card */}
          <Card glass className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                {inputMode === 'url' ? 'Process a YouTube Lecture' : 'Upload a Video File'}
              </CardTitle>
              <CardDescription>
                {inputMode === 'url'
                  ? 'Enter a YouTube URL. We\'ll download the audio, transcribe it with AI, and prepare it for Q&A.'
                  : 'Upload an MP4 or video file. We\'ll extract the audio, transcribe it with AI, and prepare it for Q&A.'
                }
              </CardDescription>
            </CardHeader>

            <div className="space-y-4">
              {inputMode === 'url' ? (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={url}
                      onChange={(e) => { setUrl(e.target.value); setError(''); }}
                      error={error}
                      disabled={processing}
                    />
                  </div>
                  <Button onClick={handleProcessUrl} disabled={processing} loading={processing} className="shrink-0">
                    {processing ? 'Processing...' : 'Process'}
                  </Button>
                </div>
              ) : (
                <div>
                  {/* Drag & Drop Zone */}
                  <div
                    onDrop={handleFileDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => !processing && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${file ? 'border-primary/40 bg-primary/5' : 'border-border-subtle hover:border-primary/30 hover:bg-surface-overlay/50'} ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                      <div className="flex items-center justify-center gap-3">
                        <FileVideo className="w-8 h-8 text-primary" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-text-primary">{file.name}</p>
                          <p className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="ml-2 p-1 rounded-lg hover:bg-surface-overlay text-text-muted hover:text-text-primary">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
                        <p className="text-sm text-text-secondary">Drop a video file here or click to browse</p>
                        <p className="text-xs text-text-muted mt-1">MP4, MKV, AVI, MOV, WebM (max 500MB)</p>
                      </div>
                    )}
                  </div>
                  {error && <p className="text-sm text-error mt-2">{error}</p>}
                  <Button onClick={handleUploadFile} disabled={processing || !file} loading={processing} className="w-full mt-4">
                    {processing ? 'Uploading & Processing...' : 'Upload & Process'}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Status Display */}
          {status && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card glass>
                <div className="flex items-center gap-4">
                  {status === 'ready' ? (
                    <CheckCircle className="w-8 h-8 text-success" />
                  ) : status === 'failed' ? (
                    <AlertCircle className="w-8 h-8 text-error" />
                  ) : (
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-text-primary">Video Processing</span>
                      <Badge variant={statusVariants[status]}>{status}</Badge>
                    </div>
                    <p className="text-sm text-text-secondary">{statusMessages[status]}</p>
                  </div>
                </div>
                {status !== 'failed' && (
                  <div className="mt-4 h-1.5 bg-surface-overlay rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" initial={{ width: '0%' }} animate={{ width: statusProgress }} transition={{ duration: 0.5 }} />
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
