import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  videoId: { type: String, required: true, unique: true, index: true },
  title: { type: String, default: '' },
  youtubeUrl: { type: String, required: true },
  transcript: { type: String, default: '' },
  status: {
    type: String,
    enum: ['queued', 'processing', 'embedding', 'ready', 'failed'],
    default: 'queued',
  },
  duration: { type: Number, default: 0 },
  chunkCount: { type: Number, default: 0 },
  errorMessage: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Video', videoSchema);
