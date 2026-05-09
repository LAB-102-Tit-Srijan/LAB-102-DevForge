import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  totalQueries: { type: Number, default: 0 },
  cacheHits: { type: Number, default: 0 },
  videosProcessed: { type: Number, default: 0 },
  totalResponseTime: { type: Number, default: 0 },
}, { timestamps: true });

// Singleton pattern — only one analytics document
analyticsSchema.statics.getInstance = async function () {
  let instance = await this.findOne();
  if (!instance) instance = await this.create({});
  return instance;
};

analyticsSchema.statics.incrementQueries = async function (responseTime = 0) {
  return this.findOneAndUpdate({}, {
    $inc: { totalQueries: 1, totalResponseTime: responseTime },
  }, { upsert: true, new: true });
};

analyticsSchema.statics.incrementCacheHits = async function () {
  return this.findOneAndUpdate({}, { $inc: { cacheHits: 1 } }, { upsert: true, new: true });
};

analyticsSchema.statics.incrementVideos = async function () {
  return this.findOneAndUpdate({}, { $inc: { videosProcessed: 1 } }, { upsert: true, new: true });
};

export default mongoose.model('Analytics', analyticsSchema);
