const express = require('express');
const multer = require('multer');
const path = require('path');
const { upload } = require('../controllers/uploadController');
const { searchByUsername, aggregatedByUser } = require('../controllers/policyController');
const { scheduleMessage } = require('../controllers/scheduleController');

const router = express.Router();
const uploadMiddleware = multer({ dest: path.join(process.cwd(), 'uploads/') });
router.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
router.post('/upload', uploadMiddleware.single('file'), upload);
router.get('/policies/search/:username', searchByUsername);
router.get('/policies/aggregate-by-user', aggregatedByUser);
router.post('/messages/schedule', scheduleMessage);
module.exports = router;
