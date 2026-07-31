import mongoose from 'mongoose';
import { seedAndReresolve } from '../src/services/catalogSeed.service.js';

seedAndReresolve()
  .then((result) => {
    console.log('SKU seed + document re-resolve complete:', result);
    return mongoose.disconnect();
  })
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  });
