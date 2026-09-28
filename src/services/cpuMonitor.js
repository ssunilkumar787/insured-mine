const os = require('os');
const cluster = require('cluster');

function cpuSnapshot() {
  return os.cpus().reduce((acc, cpu) => {
    const times = cpu.times;
    const idle = times.idle;
    const total = Object.values(times).reduce((a, b) => a + b, 0);
    return { idle: acc.idle + idle, total: acc.total + total };
  }, { idle: 0, total: 0 });
}

function startCpuMonitor() {
  const threshold = Number(process.env.CPU_THRESHOLD || 70);
  const interval = Number(process.env.CPU_SAMPLE_INTERVAL_MS || 5000);
  let previous = cpuSnapshot();
  return setInterval(() => {
    const current = cpuSnapshot();
    const totalDelta = current.total - previous.total;
    const idleDelta = current.idle - previous.idle;
    previous = current;
    const usage = totalDelta ? ((totalDelta - idleDelta) / totalDelta) * 100 : 0;
    console.log(`CPU utilization: ${usage.toFixed(2)}%`);
    if (usage >= threshold && cluster.isPrimary) {
      console.warn(`CPU threshold ${threshold}% exceeded. Restarting worker...`);
      const oldWorker = Object.values(cluster.workers)[0];
      const replacement = cluster.fork();
      replacement.once('online', () => oldWorker?.process.kill('SIGTERM'));
    }
  }, interval);
}
module.exports = { startCpuMonitor };
