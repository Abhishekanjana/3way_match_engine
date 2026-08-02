import mongoose from 'mongoose';
import config from './config.js';
import logger from './logger.js';

let isConnected = false;

async function connectDatabase() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(config.mongoose.url);
  isConnected = true;
  logger.info('MongoDB connected');

  return mongoose.connection;
}

export { connectDatabase };
