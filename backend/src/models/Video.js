import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema({
  text: String,
  startTime: Number,
  endTime: Number,
  embeddingId: String,
});

const videoSchema = new mongoose.Schema({
  videoId: { type: String, required: true, unique: true, index: true }, // Keep existing for backwards compatibility
  title: { type: String, default: '' },
  originalFileName: String,
  sourceType: String, // "youtube" | "upload"
  sourceUrl: String,
  cloudinaryUrl: String,
  cloudinaryPublicId: String,
  thumbnailUrl: String,
  duration: { type: Number, default: 0 },
  transcript: { type: String, default: '' },
  chunks: [chunkSchema],
  processingStatus: {
    type: String,
    enum: [
      "uploading",
      "queued",
      "downloading",
      "transcribing",
      "chunking",
      "embedding",
      "ready",
      "failed"
    ],
    default: "uploading"
  },
  // Keep original fields for backward compatibility during migration
  status: { type: String, default: 'queued' },
  youtubeUrl: { type: String, default: '' },
  chunkCount: { type: Number, default: 0 },
  errorMessage: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Video', videoSchema);
