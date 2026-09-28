const mongoose = require('mongoose');
const { Schema } = mongoose;

const agentSchema = new Schema({ name: { type: String, required: true, unique: true, trim: true } }, { timestamps: true });
const userSchema = new Schema({
  firstName: { type: String, required: true, trim: true }, dob: Date, address: String,
  phone: String, state: String, zipCode: String, email: { type: String, trim: true, lowercase: true },
  gender: String, userType: String
}, { timestamps: true });
userSchema.index({ firstName: 1 });
userSchema.index({ email: 1 }, { sparse: true });

const accountSchema = new Schema({ name: { type: String, required: true, trim: true } }, { timestamps: true });
accountSchema.index({ name: 1 }, { unique: true });
const lobSchema = new Schema({ categoryName: { type: String, required: true, unique: true, trim: true } }, { timestamps: true });
const carrierSchema = new Schema({ companyName: { type: String, required: true, unique: true, trim: true } }, { timestamps: true });
const policySchema = new Schema({
  policyNumber: { type: String, required: true, unique: true, index: true },
  policyStartDate: Date, policyEndDate: Date,
  policyCategoryId: { type: Schema.Types.ObjectId, ref: 'LOB', required: true },
  companyCollectionId: { type: Schema.Types.ObjectId, ref: 'Carrier', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  accountId: { type: Schema.Types.ObjectId, ref: 'Account' },
  agentId: { type: Schema.Types.ObjectId, ref: 'Agent' },
  premiumAmount: Number, policyMode: Number, producer: String, policyType: String,
  city: String, accountType: String, csr: String, primary: String, agencyId: String,
  applicantId: String, hasActiveClientPolicy: String
}, { timestamps: true });
policySchema.index({ userId: 1, policyStartDate: -1 });

const scheduledMessageSchema = new Schema({
  message: { type: String, required: true, trim: true },
  scheduledAt: { type: Date, required: true, index: true },
  status: { type: String, enum: ['pending', 'processing', 'completed'], default: 'pending', index: true },
  createdAt: { type: Date, default: Date.now }
});
const messageSchema = new Schema({ message: String, scheduledAt: Date, createdAt: { type: Date, default: Date.now } });

module.exports = {
  Agent: mongoose.model('Agent', agentSchema), User: mongoose.model('User', userSchema),
  Account: mongoose.model('Account', accountSchema), LOB: mongoose.model('LOB', lobSchema),
  Carrier: mongoose.model('Carrier', carrierSchema), Policy: mongoose.model('Policy', policySchema),
  ScheduledMessage: mongoose.model('ScheduledMessage', scheduledMessageSchema), Message: mongoose.model('Message', messageSchema)
};
