import mongoose from 'mongoose';
import logger from '../utils/logger.js';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.warn('MONGODB_URI not set — MongoDB features disabled');
    return null;
  }
  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10, // Scalability: connection pooling for concurrent requests
    });
    logger.info('✅ MongoDB connected');
    return mongoose.connection;
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    throw err;
  }
};

export default mongoose;
