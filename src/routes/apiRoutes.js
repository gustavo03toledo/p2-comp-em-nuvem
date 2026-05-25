const express = require('express');
const googleDriveService = require('../services/googleDriveService');
const azureBlobService = require('../services/azureBlobService');
const migrationService = require('../services/migrationService');

const router = express.Router();

router.get('/origin', async (req, res, next) => {
  try {
    const files = await googleDriveService.listFiles();
    res.json({
      count: files.length,
      files
    });
  } catch (error) {
    next(error);
  }
});

router.get('/destination', async (req, res, next) => {
  try {
    const files = await azureBlobService.listBlobs();
    res.json({
      count: files.length,
      files
    });
  } catch (error) {
    next(error);
  }
});

router.post('/migrate', async (req, res, next) => {
  try {
    const results = await migrationService.migrateFiles();
    res.json(results);
  } catch (error) {
    next(error);
  }
});

router.delete('/destination', async (req, res, next) => {
  try {
    const results = await azureBlobService.deleteAllBlobs();
    res.json(results);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
