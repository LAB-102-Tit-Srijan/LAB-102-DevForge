import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Link as LinkIcon, Loader2, CheckCircle, AlertCircle, Video } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { toast } from '../components/ui/Toast';
import { processVideo, getVideoStatus } from '../lib/api';

const statusMessages = {
  queued: 'Video is queued for processing...',
  processing: 'Extracting transcript and chunking...',
  embedding: 'Generating embeddings and storing in vector DB...',
  ready: 'Video is ready! Redirecting...',
  failed: 'Processing failed. Please try again.',
};

const statusVariants = {
  queued: 'warning',
  processing: 'primary',
  embedding: 'accent',
  ready: 'success',
  failed: 'error',
};

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState(null);
  const [videoId, setVideoId] = useState(null);

  // Validate YouTube URL
  const validateUrl = (url) => {
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/youtu\.be\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
    ];
    return patterns.some((p) => p.test(url));
  };

  // Poll video status every 3 seconds
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
          toast.error('Video processing failed. Please try again.');
          setProcessing(false);
          return;
        }

        // Continue polling
        setTimeout(poll, 3000);
      } catch (err) {
        console.error('Polling error:', err);
        setTimeout(poll, 3000);
      }
    };
    poll();
  };

  // Handle video processing
  const handleProcess = async () => {
    setError('');

    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!validateUrl(url.trim())) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setProcessing(true);
    setStatus('queued');

    try {
      const { data } = await processVideo(url.trim());
      setVideoId(data.videoId);
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

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
              <Upload className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
            <p className="text-text-secondary">
              Paste a YouTube lecture URL to transform it into an interactive AI tutor.
            </p>
          </div>

          {/* Upload Card */}
          <Card glass className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                Process a Lecture
              </CardTitle>
              <CardDescription>
                Enter a YouTube URL and we'll extract the transcript, generate embeddings,
                and prepare it for AI-powered Q&A.
              </CardDescription>
            </CardHeader>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError('');
                    }}
                    error={error}
                    disabled={processing}
                  />
                </div>
                <Button
                  onClick={handleProcess}
                  disabled={processing}
                  loading={processing}
                  className="shrink-0"
                >
                  {processing ? 'Processing...' : 'Process'}
                </Button>
              </div>

              {/* Tips */}
              <div className="flex items-start gap-2 text-xs text-text-muted">
                <LinkIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>Supports standard YouTube URLs, shortened URLs (youtu.be), and embed URLs.</span>
              </div>
            </div>
          </Card>

          {/* Status Display */}
          {status && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
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
                      <span className="font-semibold text-text-primary">
                        Video Processing
                      </span>
                      <Badge variant={statusVariants[status]}>
                        {status}
                      </Badge>
                    </div>
                    <p className="text-sm text-text-secondary">
                      {statusMessages[status]}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                {status !== 'failed' && (
                  <div className="mt-4 h-1.5 bg-surface-overlay rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                      initial={{ width: '0%' }}
                      animate={{
                        width: status === 'queued' ? '20%'
                          : status === 'processing' ? '50%'
                          : status === 'embedding' ? '80%'
                          : '100%',
                      }}
                      transition={{ duration: 0.5 }}
                    />
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
