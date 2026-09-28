const { ScheduledMessage, Message } = require('../models');

function startScheduler() {
  const interval = Number(process.env.SCHEDULER_INTERVAL_MS || 1000);
  const tick = async () => {
    try {
      const due = await ScheduledMessage.findOneAndUpdate(
        { status: 'pending', scheduledAt: { $lte: new Date() } },
        { $set: { status: 'processing' } },
        { sort: { scheduledAt: 1 }, new: true }
      );
      if (!due) return;
      await Message.create({ message: due.message, scheduledAt: due.scheduledAt });
      await ScheduledMessage.updateOne({ _id: due._id }, { $set: { status: 'completed' } });
    } catch (error) { console.error('Scheduler error:', error.message); }
  };
  return setInterval(tick, interval);
}
module.exports = { startScheduler };
