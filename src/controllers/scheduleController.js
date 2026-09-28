const { ScheduledMessage } = require('../models');

async function scheduleMessage(req, res, next) {
  try {
    const { message, day, time } = req.body;
    if (!message || !day || !time) return res.status(400).json({ message: 'message, day and time are required' });
    const scheduledAt = new Date(`${day}T${time}:00`);
    if (Number.isNaN(scheduledAt.getTime())) return res.status(400).json({ message: 'Invalid day/time. Use day=YYYY-MM-DD and time=HH:mm' });
    if (scheduledAt <= new Date()) return res.status(400).json({ message: 'Scheduled time must be in the future' });
    const doc = await ScheduledMessage.create({ message, scheduledAt });
    res.status(201).json({ message: 'Message scheduled', data: doc });
  } catch (e) { next(e); }
}
module.exports = { scheduleMessage };
