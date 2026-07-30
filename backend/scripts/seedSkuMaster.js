const mongoose = require('mongoose');
const { seedAndReresolve } = require('../src/services/catalogSeed.service');

seedAndReresolve()
  .then((result) => {
    console.log('SKU seed + document re-resolve complete:', result);
    return mongoose.disconnect();
  })
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  });
