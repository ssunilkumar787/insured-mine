const fs = require('fs');
const { importRows } = require('../services/importService');

async function upload(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Upload an XLSX/CSV file using field name "file"' });
    const extension = require('path').extname(req.file.originalname).toLowerCase();
    if (!['.csv', '.xlsx', '.xls'].includes(extension)) return res.status(400).json({ message: 'Only CSV, XLSX and XLS files are supported' });
    const result = await importRows(req.file.path);
    fs.unlink(req.file.path, () => {});
    res.status(201).json({ message: 'Import completed', ...result });
  } catch (e) { if (req.file?.path) fs.unlink(req.file.path, () => {}); next(e); }
}
module.exports = { upload };
