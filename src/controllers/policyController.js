const { Policy, User } = require('../models');

async function searchByUsername(req, res, next) {
  try {
    const username = req.params.username || req.query.username;
    if (!username) return res.status(400).json({ message: 'username is required' });
    const users = await User.find({ firstName: { $regex: username, $options: 'i' } }).select('_id firstName email phone userType');
    const userIds = users.map((u) => u._id);
    const policies = await Policy.find({ userId: { $in: userIds } })
      .populate('userId', 'firstName email phone userType').populate('agentId', 'name')
      .populate('accountId', 'name').populate('policyCategoryId', 'categoryName').populate('companyCollectionId', 'companyName');
    res.json({ count: policies.length, policies });
  } catch (e) { next(e); }
}

async function aggregatedByUser(req, res, next) {
  try {
    const data = await Policy.aggregate([
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $group: {
        _id: '$userId', username: { $first: '$user.firstName' }, email: { $first: '$user.email' },
        totalPolicies: { $sum: 1 }, totalPremium: { $sum: { $ifNull: ['$premiumAmount', 0] } },
        activePolicies: { $sum: { $cond: [{ $gte: ['$policyEndDate', new Date()] }, 1, 0] } },
        policies: { $push: { policyNumber: '$policyNumber', startDate: '$policyStartDate', endDate: '$policyEndDate' } }
      } },
      { $sort: { totalPolicies: -1 } }
    ]);
    res.json({ count: data.length, users: data });
  } catch (e) { next(e); }
}

module.exports = { searchByUsername, aggregatedByUser };
