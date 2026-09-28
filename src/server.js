require('dotenv').config();
const cluster = require('cluster');
const os = require('os');
const http = require('http');
const connectDB = require('./config/db');

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} started. CPUs: ${os.cpus().length}`);
  cluster.fork();
  const { startCpuMonitor } = require('./services/cpuMonitor');
  startCpuMonitor();
  cluster.on('exit', (worker) => {
    console.warn(`Worker ${worker.process.pid} exited. Starting replacement...`);
    cluster.fork();
  });
} else {
  (async () => {
    await connectDB();
    const app = require('./app');
    const port = Number(process.env.PORT || 3000);
    const server = http.createServer(app);
    server.listen(port, () => console.log(`Worker ${process.pid} listening on port ${port}`));
    const { startScheduler } = require('./services/scheduler');
    startScheduler();
  })().catch((error) => { console.error(error); process.exit(1); });
}
