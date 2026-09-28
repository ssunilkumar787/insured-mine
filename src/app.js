const express = require('express');
const routes = require('./routes');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', routes);
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ message: 'Internal server error', error: err.message }); });
module.exports = app;
